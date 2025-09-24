import { ref } from "vue";

export function useBackendMessage() {
  const backendMessage = ref("");
  const backendMessageType = ref("");

  function showBackendMessage(msg, type = "info") {
    backendMessage.value = msg;
    backendMessageType.value = type;
    setTimeout(() => {
      backendMessage.value = "";
    }, 3500);
  }

  return {
    backendMessage,
    backendMessageType,
    showBackendMessage,
  };
}