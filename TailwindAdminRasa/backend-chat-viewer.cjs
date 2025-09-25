#!/usr/bin/env node
/**
 * 🔍 BACKEND CHAT LOGS VIEWER
 * Xem chat logs trực tiếp từ terminal
 * Usage: node backend-chat-viewer.js [limit]
 */

const http = require('http');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[91m',
  blue: '\x1b[34m'
};

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString('vi-VN');
}

function fetchChatLogs(limit = 10) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/rasa/conversations?limit=${limit}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success) {
          displayChatLogs(response.data, limit);
        } else {
          console.error('❌ Error:', response.error || 'Unknown error');
        }
      } catch (error) {
        console.error('❌ JSON Parse Error:', error.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request Error:', error.message);
    console.log('💡 Make sure the server is running on localhost:5000');
  });

  req.end();
}

function displayChatLogs(conversations, limit) {
  console.log(`${COLORS.bright}${COLORS.cyan}=== BACKEND CHAT LOGS (Latest ${limit}) ===${COLORS.reset}\n`);

  if (conversations.length === 0) {
    console.log(`${COLORS.yellow}📝 No conversations found${COLORS.reset}\n`);
    return;
  }

  conversations.forEach((conv, index) => {
    console.log(`${COLORS.bright}--- Conversation ${index + 1} ---${COLORS.reset}`);
    console.log(`🆔 ID: ${COLORS.cyan}${conv.id}${COLORS.reset}`);
    console.log(`👤 Session: ${COLORS.green}${conv.sessionId}${COLORS.reset}`);
    console.log(`📊 Status: ${COLORS.yellow}${conv.status}${COLORS.reset}`);
    console.log(`⏰ Created: ${COLORS.blue}${formatTime(conv.createdAt)}${COLORS.reset}`);
    console.log(`💬 Messages: ${COLORS.cyan}${conv.messages ? conv.messages.length : 0}${COLORS.reset}\n`);

    if (conv.messages && conv.messages.length > 0) {
      conv.messages.forEach((msg, msgIndex) => {
        const timeStr = formatTime(msg.timestamp);
        const senderIcon = msg.senderType === 'user' ? '👤' : '🤖';
        const senderColor = msg.senderType === 'user' ? COLORS.green : COLORS.cyan;
        
        console.log(`  [${msgIndex + 1}] ${timeStr}`);
        console.log(`  ${senderIcon} ${senderColor}${msg.senderType.toUpperCase()}${COLORS.reset}: ${msg.content}`);
        
        if (msg.metadata && msg.metadata.buttons && msg.metadata.buttons.length > 0) {
          console.log(`      🔘 Buttons: ${COLORS.yellow}${msg.metadata.buttons.map(b => b.title).join(', ')}${COLORS.reset}`);
        }
        console.log('');
      });
    } else {
      console.log(`  ${COLORS.yellow}📝 No messages${COLORS.reset}\n`);
    }
    
    console.log(`${'='.repeat(60)}\n`);
  });

  // Summary
  console.log(`${COLORS.bright}📈 SUMMARY:${COLORS.reset}`);
  console.log(`Total Conversations: ${COLORS.cyan}${conversations.length}${COLORS.reset}`);
  console.log(`Active Conversations: ${COLORS.green}${conversations.filter(c => c.status === 'active').length}${COLORS.reset}`);
  console.log(`Generated: ${COLORS.blue}${formatTime(new Date())}${COLORS.reset}\n`);
}

// Main execution
const args = process.argv.slice(2);
const limit = args[0] ? parseInt(args[0]) : 10;

if (isNaN(limit) || limit < 1) {
  console.error('❌ Invalid limit. Usage: node backend-chat-viewer.js [limit]');
  process.exit(1);
}

console.log(`${COLORS.bright}🔍 Fetching ${limit} latest chat conversations...${COLORS.reset}\n`);
fetchChatLogs(limit);