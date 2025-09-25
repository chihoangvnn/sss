#!/usr/bin/env node
/**
 * 🤖 BOT STATUS CHECKER TOOL
 * Kiểm tra trạng thái bot một cách đầy đủ
 * Usage: node bot-status-checker.cjs [--fresh] [--detailed]
 */

const http = require('http');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[91m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

const EMOJIS = {
  online: '🟢',
  offline: '🔴', 
  warning: '🟡',
  loading: '⏳',
  rocket: '🚀',
  robot: '🤖',
  server: '🖥️',
  check: '✅',
  cross: '❌'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            data: parsed,
            raw: responseData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: null,
            raw: responseData,
            error: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({ error: error.message, code: error.code });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({ error: 'Request timeout', code: 'TIMEOUT' });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function checkServerStatus() {
  log(`\n${COLORS.bright}${EMOJIS.server} CHECKING SERVER STATUS...${COLORS.reset}`);
  
  try {
    const response = await makeRequest('/api/health');
    if (response.statusCode === 200) {
      log(`${EMOJIS.check} Server: ${COLORS.green}ONLINE${COLORS.reset}`, 'green');
      return true;
    } else {
      log(`${EMOJIS.warning} Server: ${COLORS.yellow}RESPONDING (${response.statusCode})${COLORS.reset}`, 'yellow');
      return true;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`${EMOJIS.cross} Server: ${COLORS.red}OFFLINE${COLORS.reset}`, 'red');
      return false;
    } else {
      log(`${EMOJIS.warning} Server: ${COLORS.yellow}UNKNOWN (${error.error})${COLORS.reset}`, 'yellow');
      return false;
    }
  }
}

async function checkRasaStatus() {
  log(`\n${COLORS.bright}${EMOJIS.robot} CHECKING RASA BOT STATUS...${COLORS.reset}`);
  
  try {
    const response = await makeRequest('/api/rasa-management/server/status');
    if (response.statusCode === 200 && response.data) {
      const { isRunning, uptime, lastCheck } = response.data;
      
      if (isRunning) {
        log(`${EMOJIS.check} RASA Server: ${COLORS.green}ONLINE${COLORS.reset}`, 'green');
        log(`${EMOJIS.rocket} Uptime: ${COLORS.cyan}${Math.floor(uptime/1000)}s${COLORS.reset}`, 'cyan');
        log(`${EMOJIS.loading} Last Check: ${COLORS.blue}${new Date(lastCheck).toLocaleString('vi-VN')}${COLORS.reset}`, 'blue');
        return { status: 'online', uptime, lastCheck };
      } else {
        log(`${EMOJIS.cross} RASA Server: ${COLORS.red}OFFLINE${COLORS.reset}`, 'red');
        return { status: 'offline' };
      }
    } else {
      log(`${EMOJIS.warning} RASA Status: ${COLORS.yellow}UNKNOWN (${response.statusCode})${COLORS.reset}`, 'yellow');
      return { status: 'unknown', statusCode: response.statusCode };
    }
  } catch (error) {
    log(`${EMOJIS.cross} RASA Status: ${COLORS.red}ERROR (${error.error})${COLORS.reset}`, 'red');
    return { status: 'error', error: error.error };
  }
}

async function testBotResponse() {
  log(`\n${COLORS.bright}${EMOJIS.robot} TESTING BOT RESPONSE...${COLORS.reset}`);
  
  try {
    const testMessage = {
      message: "test bot status",
      sender: "status-checker",
      session_id: `test-${Date.now()}`
    };

    const response = await makeRequest('/api/rasa/chat', 'POST', testMessage);
    
    if (response.statusCode === 200 && response.data?.status === 'success') {
      log(`${EMOJIS.check} Bot Response: ${COLORS.green}WORKING${COLORS.reset}`, 'green');
      log(`${EMOJIS.robot} Response: ${COLORS.cyan}"${response.data.responses[0]?.text || 'No text response'}"${COLORS.reset}`, 'cyan');
      return { status: 'working', response: response.data };
    } else {
      log(`${EMOJIS.warning} Bot Response: ${COLORS.yellow}ISSUES (${response.statusCode})${COLORS.reset}`, 'yellow');
      if (response.data?.error) {
        log(`${EMOJIS.cross} Error: ${COLORS.red}${response.data.error}${COLORS.reset}`, 'red');
      }
      return { status: 'issues', statusCode: response.statusCode, data: response.data };
    }
  } catch (error) {
    log(`${EMOJIS.cross} Bot Response: ${COLORS.red}FAILED (${error.error})${COLORS.reset}`, 'red');
    return { status: 'failed', error: error.error };
  }
}

async function checkConversations() {
  log(`\n${COLORS.bright}💬 CHECKING CONVERSATION HISTORY...${COLORS.reset}`);
  
  try {
    const response = await makeRequest('/api/rasa/conversations?limit=5');
    
    if (response.statusCode === 200 && response.data?.success) {
      const count = response.data.count || 0;
      log(`${EMOJIS.check} Conversations: ${COLORS.green}${count} FOUND${COLORS.reset}`, 'green');
      
      if (count > 0) {
        const latest = response.data.data[0];
        log(`${EMOJIS.loading} Latest: ${COLORS.blue}${latest.sessionId} (${latest.messages?.length || 0} messages)${COLORS.reset}`, 'blue');
        log(`${EMOJIS.loading} Status: ${COLORS.cyan}${latest.status}${COLORS.reset}`, 'cyan');
      }
      return { status: 'working', count, latest: response.data.data[0] };
    } else {
      log(`${EMOJIS.warning} Conversations: ${COLORS.yellow}ACCESS ISSUES${COLORS.reset}`, 'yellow');
      return { status: 'issues', statusCode: response.statusCode };
    }
  } catch (error) {
    log(`${EMOJIS.cross} Conversations: ${COLORS.red}ERROR (${error.error})${COLORS.reset}`, 'red');
    return { status: 'error', error: error.error };
  }
}

async function getSystemInfo() {
  log(`\n${COLORS.bright}📊 SYSTEM INFORMATION...${COLORS.reset}`);
  
  try {
    // Get process info
    const memUsage = process.memoryUsage();
    log(`${EMOJIS.loading} Memory: ${COLORS.cyan}${Math.round(memUsage.heapUsed / 1024 / 1024)}MB used${COLORS.reset}`, 'cyan');
    log(`${EMOJIS.loading} Node.js: ${COLORS.blue}${process.version}${COLORS.reset}`, 'blue');
    
    // Try to get ngrok status if available
    try {
      const ngrokCheck = execSync('pgrep -f ngrok', { encoding: 'utf8', timeout: 3000 });
      if (ngrokCheck.trim()) {
        log(`${EMOJIS.check} Ngrok: ${COLORS.green}RUNNING${COLORS.reset}`, 'green');
      }
    } catch (e) {
      log(`${EMOJIS.warning} Ngrok: ${COLORS.yellow}NOT DETECTED${COLORS.reset}`, 'yellow');
    }
  } catch (error) {
    log(`${EMOJIS.warning} System Info: ${COLORS.yellow}PARTIAL${COLORS.reset}`, 'yellow');
  }
}

function printSummary(results) {
  log(`\n${COLORS.bright}📋 STATUS SUMMARY${COLORS.reset}`);
  log('='.repeat(50));
  
  const serverOk = results.server;
  const rasaOk = results.rasa?.status === 'online';
  const botOk = results.botResponse?.status === 'working';
  const conversationsOk = results.conversations?.status === 'working';
  
  const overallStatus = serverOk && rasaOk && botOk && conversationsOk ? 'HEALTHY' : 
                       serverOk && rasaOk ? 'PARTIAL' : 'UNHEALTHY';
  
  const statusColor = overallStatus === 'HEALTHY' ? 'green' : 
                     overallStatus === 'PARTIAL' ? 'yellow' : 'red';
  
  const statusEmoji = overallStatus === 'HEALTHY' ? EMOJIS.check : 
                     overallStatus === 'PARTIAL' ? EMOJIS.warning : EMOJIS.cross;
  
  log(`${statusEmoji} Overall Status: ${COLORS[statusColor]}${overallStatus}${COLORS.reset}`, statusColor);
  log(`🖥️  Server: ${serverOk ? COLORS.green + 'OK' : COLORS.red + 'DOWN'}${COLORS.reset}`);
  log(`🤖 RASA: ${rasaOk ? COLORS.green + 'OK' : COLORS.red + 'DOWN'}${COLORS.reset}`);
  log(`💬 Chat: ${botOk ? COLORS.green + 'OK' : COLORS.red + 'DOWN'}${COLORS.reset}`);
  log(`📝 Conversations: ${conversationsOk ? COLORS.green + 'OK' : COLORS.red + 'DOWN'}${COLORS.reset}`);
  
  log('='.repeat(50));
  log(`⏰ Checked: ${COLORS.blue}${new Date().toLocaleString('vi-VN')}${COLORS.reset}`, 'blue');
}

async function main() {
  const args = process.argv.slice(2);
  const fresh = args.includes('--fresh');
  const detailed = args.includes('--detailed');
  
  log(`${COLORS.bright}${COLORS.magenta}🤖 BOT STATUS CHECKER${COLORS.reset}`);
  log(`${COLORS.bright}Kiểm tra trạng thái bot và hệ thống...${COLORS.reset}`);
  
  if (fresh) {
    log(`${EMOJIS.loading} Fresh mode: Kiểm tra từ đầu...`, 'cyan');
  }
  
  const results = {};
  
  // Check server
  results.server = await checkServerStatus();
  
  if (!results.server) {
    log(`\n${EMOJIS.cross} ${COLORS.red}SERVER OFFLINE - Cannot check bot status${COLORS.reset}`);
    return;
  }
  
  // Check RASA
  results.rasa = await checkRasaStatus();
  
  // Test bot response
  results.botResponse = await testBotResponse();
  
  // Check conversations
  results.conversations = await checkConversations();
  
  if (detailed) {
    await getSystemInfo();
  }
  
  // Print summary
  printSummary(results);
  
  // Refresh suggestions
  log(`\n${COLORS.bright}💡 REFRESH COMMANDS:${COLORS.reset}`);
  log(`• Fresh check: ${COLORS.cyan}node bot-status-checker.cjs --fresh${COLORS.reset}`);
  log(`• Detailed info: ${COLORS.cyan}node bot-status-checker.cjs --detailed${COLORS.reset}`);
  log(`• Chat logs: ${COLORS.cyan}node backend-chat-viewer.cjs 5${COLORS.reset}`);
  log(`• Test chat: ${COLORS.cyan}curl -X POST http://localhost:5000/api/rasa/chat -H "Content-Type: application/json" -d '{"message":"test","sender":"user","session_id":"test"}'${COLORS.reset}`);
}

// Run the checker
main().catch(error => {
  log(`${EMOJIS.cross} ${COLORS.red}FATAL ERROR: ${error.message}${COLORS.reset}`, 'red');
  process.exit(1);
});