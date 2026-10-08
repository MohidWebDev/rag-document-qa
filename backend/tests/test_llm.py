import pytest
from tenacity import wait_none

import llm


class FakeMessage:
    def __init__(self, content):
        self.content = content


class FakeLLM:
    def __init__(self, content="Answer [1]", fail_with=None, fail_times=0):
        self.content = content
        self.fail_with = fail_with
        self.fail_times = fail_times
        self.calls = 0
        self.last_messages = None

    def invoke(self, messages):
        self.calls += 1
        if self.fail_times > 0:
            self.fail_times -= 1
            raise self.fail_with
        self.last_messages = messages
        return FakeMessage(self.content)


@pytest.fixture()
def no_waiting(monkeypatch):
    monkeypatch.setattr(llm.generate_answer.retry, "wait", wait_none())


def use(monkeypatch, fake):
    monkeypatch.setattr(llm, "get_llm", lambda: fake)
    return fake


def test_string_reply_is_returned_stripped(monkeypatch):
    use(monkeypatch, FakeLLM("  The answer is 24 months [1].  "))
    assert llm.generate_answer([("human", "hi")]) == "The answer is 24 months [1]."


def test_block_reply_keeps_only_text(monkeypatch):
    blocks = [
        {"type": "thinking", "thinking": "hidden reasoning"},
        {"type": "text", "text": "Hello "},
        {"type": "text", "text": "world"},
    ]
    use(monkeypatch, FakeLLM(blocks))
    assert llm.generate_answer([("human", "hi")]) == "Hello world"


def test_messages_are_passed_through(monkeypatch):
    fake = use(monkeypatch, FakeLLM())
    messages = [("system", "rules"), ("human", "question")]
    llm.generate_answer(messages)
    assert fake.last_messages == messages


def test_temporary_errors_are_retried(monkeypatch, no_waiting):
    fake = use(monkeypatch, FakeLLM("ok", fail_with=RuntimeError("503 UNAVAILABLE"), fail_times=2))
    assert llm.generate_answer([("human", "hi")]) == "ok"
    assert fake.calls == 3


def test_other_errors_are_not_retried(monkeypatch, no_waiting):
    fake = use(monkeypatch, FakeLLM(fail_with=ValueError("API key not valid"), fail_times=5))
    with pytest.raises(ValueError):
        llm.generate_answer([("human", "hi")])
    assert fake.calls == 1


class FakeModels:
    def __init__(self, text):
        self.text = text
        self.kwargs = None

    def generate_content(self, **kwargs):
        self.kwargs = kwargs
        return type("Response", (), {"text": self.text})()


class FakeClient:
    def __init__(self, text="Answer"):
        self.models = FakeModels(text)


def test_chat_splits_system_and_user_and_disables_afc():
    client = FakeClient("Answer")
    chat = llm.GeminiChat(client, "some-model", "low")

    reply = chat.invoke([("system", "rules"), ("human", "question")])

    kwargs = client.models.kwargs
    assert reply.content == "Answer"
    assert kwargs["model"] == "some-model"
    assert kwargs["contents"] == "question"
    assert kwargs["config"].system_instruction == "rules"
    assert kwargs["config"].automatic_function_calling.disable is True


def test_chat_handles_empty_reply():
    chat = llm.GeminiChat(FakeClient(None), "some-model", "low")
    assert chat.invoke([("human", "question")]).content == ""