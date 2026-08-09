<script setup>
import { ref } from "vue";
import ChatServices from "../services/ChatServices.js";

const props = defineProps({
  projectId: {
    type: Number,
    default: null,
  },
});

const showChat = ref(false);
const chatMessages = ref([]);
const chatHistory = ref([]);
const chatInput = ref("");
const sendingMessage = ref(false);

async function sendMessage() {
  if (chatInput.value.trim() === "" || sendingMessage.value) {
    return;
  }

  // Adds the user's message to the panel.
  const userMessage = chatInput.value;
  chatMessages.value.push({ role: "user", text: userMessage });
  chatInput.value = "";
  sendingMessage.value = true;

  try {
    const response = await ChatServices.sendMessage(userMessage, props.projectId, chatHistory.value);
    chatMessages.value.push({ role: "bot", text: response.data.reply });

    // Remembers conversation for the next message.
    chatHistory.value.push({ role: "user", content: userMessage });
    chatHistory.value.push({ role: "assistant", content: response.data.reply });
  } catch (error) {
    console.log(error);
    chatMessages.value.push({
      role: "bot",
      text: "Sorry, something went wrong answering that.",
    });
  } finally {
    sendingMessage.value = false;
  }
}
</script>

<template>
  <!-- Button for the chat panel. -->
  <v-btn
    v-if="!showChat"
    icon="mdi-chat"
    color="primary"
    size="large"
    class="chat-toggle-btn"
    @click="showChat = true"
  ></v-btn>

  <!-- Chat panel. -->
  <v-card v-if="showChat" class="chat-panel">
    <v-card-title class="d-flex align-center justify-space-between chat-header">
      <span>Storyboard Assistant</span>
      <v-btn
        icon="mdi-close"
        size="small"
        variant="text"
        @click="showChat = false"
      ></v-btn>
    </v-card-title>

    <v-card-text class="chat-messages">
      <div
        v-for="(chatMessage, index) in chatMessages" :key="index"
        class="chat-message"
        :class="chatMessage.role === 'user' ? 'chat-message-user' : 'chat-message-bot'"
      >
        {{ chatMessage.text }}
      </div>

      <div v-if="sendingMessage" class="chat-message chat-message-bot">
        Thinking...
      </div>
    </v-card-text>

    <v-card-actions class="chat-input-row">
      <v-text-field
        v-model="chatInput"
        placeholder="Ask about this project's stories or sprints..."
        density="compact"
        variant="outlined"
        hide-details
        @keyup.enter="sendMessage"
      ></v-text-field>

      <v-btn
        icon="mdi-send"
        color="primary"
        class="ml-2"
        :disabled="sendingMessage"
        @click="sendMessage"
      ></v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.chat-toggle-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.chat-panel {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 340px;
  height: 460px;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.chat-header {
  flex-shrink: 0;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
}

.chat-message {
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  max-width: 85%;
  white-space: pre-wrap;
}

.chat-message-user {
  background-color: #0a3158;
  color: white;
  margin-left: auto;
}

.chat-message-bot {
  background-color: #f0f0f0;
}

.chat-input-row {
  flex-shrink: 0;
}
</style>
