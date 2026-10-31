export function getAssistantProviderFailure(error) {
  const status = error && typeof error === "object" && "status" in error
    ? error.status
    : undefined;

  if (status === 401) {
    return {
      status: 503,
      message: "The assistant's OpenAI API key was rejected. Set a valid secret API key in the backend environment and restart the server."
    };
  }
  if (status === 429) {
    return {
      status: 503,
      message: "The assistant is temporarily unavailable because the OpenAI API is rate-limited or out of quota. Check the API project limits and try again later."
    };
  }
  if (status === 400) {
    return {
      status: 503,
      message: "OpenAI rejected the assistant configuration. Check the server-side model setting and try again."
    };
  }
  return {
    status: 503,
    message: "The assistant could not reach OpenAI. Please try again later."
  };
}
