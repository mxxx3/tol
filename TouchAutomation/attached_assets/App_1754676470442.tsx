import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
// import { WebView } from 'react-native-webview';

interface BotStats {
  clicks: number;
  score: number;
  attempts: number;
  success_rate: number;
}

interface GameState {
  started: boolean;
  gameOver: boolean;
  score: number;
}

const { width, height } = Dimensions.get('window');

export default function App() {
  const [gameUrl, setGameUrl] = useState('https://ppkas.com/#crazyRo');
  const [botActive, setBotActive] = useState(false);
  const [stats, setStats] = useState<BotStats>({
    clicks: 0,
    score: 0,
    attempts: 0,
    success_rate: 0
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [webViewRef, setWebViewRef] = useState<any>(null);
  const [strategy, setStrategy] = useState('Periodic');

  const strategies = ['Periodic', 'Fast Response', 'Slow Steady', 'Adaptive'];

  // Bot control JavaScript injection
  const botControlScript = `
    (function() {
      let botActive = false;
      let clickCount = 0;
      let currentStrategy = 'Periodic';
      let strategyInterval = null;
      
      // Strategy configurations
      const strategies = {
        'Periodic': { interval: 1500, description: 'Regular clicks every 1.5s' },
        'Fast Response': { interval: 800, description: 'Quick reaction clicks' },
        'Slow Steady': { interval: 2200, description: 'Careful, measured clicks' },
        'Adaptive': { interval: 1200, description: 'Adapts based on game state' }
      };
      
      // Game state detection
      function detectGameState() {
        const pageText = document.body.innerText.toLowerCase();
        const gameStarted = !pageText.includes('tap to start') && 
                           !pageText.includes('click to start') && 
                           !pageText.includes('get ready');
        const gameOver = pageText.includes('game over') || 
                        pageText.includes('try again') || 
                        pageText.includes('restart');
        
        // Try to extract score
        let score = 0;
        const scoreMatch = pageText.match(/score[:\\s]*(\\d+)/i) || 
                          pageText.match(/^(\\d+)$/);
        if (scoreMatch) {
          score = parseInt(scoreMatch[1]) || 0;
        }
        
        return { started: gameStarted, gameOver, score };
      }
      
      // Execute game click
      function executeClick() {
        try {
          // Multiple click methods for better compatibility
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: window.innerWidth / 2,
            clientY: window.innerHeight / 2,
            button: 0
          });
          
          const touchEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true
          });
          
          const spaceEvent = new KeyboardEvent('keydown', {
            key: ' ',
            code: 'Space',
            keyCode: 32,
            bubbles: true
          });
          
          // Fire events on different targets
          document.dispatchEvent(clickEvent);
          document.dispatchEvent(touchEvent);
          document.dispatchEvent(spaceEvent);
          
          // Try canvas if exists
          const canvas = document.querySelector('canvas');
          if (canvas) {
            canvas.dispatchEvent(clickEvent);
            canvas.dispatchEvent(touchEvent);
          }
          
          // Try body click
          document.body.dispatchEvent(clickEvent);
          
          clickCount++;
          
          // Send stats to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'bot_click',
            clickCount,
            gameState: detectGameState(),
            strategy: currentStrategy
          }));
          
          return true;
        } catch (error) {
          console.error('Click execution failed:', error);
          return false;
        }
      }
      
      // Start bot with strategy
      function startBot(strategyName) {
        if (botActive) return;
        
        botActive = true;
        currentStrategy = strategyName;
        const config = strategies[strategyName];
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'bot_started',
          strategy: strategyName,
          interval: config.interval
        }));
        
        strategyInterval = setInterval(() => {
          if (!botActive) return;
          
          const gameState = detectGameState();
          
          // Handle different game states
          if (!gameState.started || gameState.gameOver) {
            executeClick(); // Click to start/restart
          } else {
            // Game is running - execute strategy
            executeClick();
          }
          
        }, config.interval);
      }
      
      // Stop bot
      function stopBot() {
        botActive = false;
        if (strategyInterval) {
          clearInterval(strategyInterval);
          strategyInterval = null;
        }
        
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'bot_stopped',
          finalStats: {
            clicks: clickCount,
            score: detectGameState().score
          }
        }));
      }
      
      // Manual click test
      function testClick() {
        const success = executeClick();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'test_click',
          success,
          gameState: detectGameState()
        }));
      }
      
      // Expose functions to React Native
      window.GameBot = {
        start: startBot,
        stop: stopBot,
        test: testClick,
        getStats: () => ({
          active: botActive,
          clicks: clickCount,
          strategy: currentStrategy,
          gameState: detectGameState()
        })
      };
      
      // Initial state message
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'bot_ready',
        message: 'Game bot initialized successfully'
      }));
      
    })();
    
    true; // Return value for WebView
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'bot_ready':
          addLog('Bot initialized successfully');
          break;
          
        case 'bot_started':
          addLog(`Bot started with ${data.strategy} strategy`);
          setBotActive(true);
          break;
          
        case 'bot_stopped':
          addLog(`Bot stopped. Final stats: ${data.finalStats.clicks} clicks, ${data.finalStats.score} score`);
          setBotActive(false);
          setStats(prev => ({
            ...prev,
            clicks: data.finalStats.clicks,
            score: data.finalStats.score
          }));
          break;
          
        case 'bot_click':
          setStats(prev => ({
            ...prev,
            clicks: data.clickCount,
            score: data.gameState.score,
            attempts: data.clickCount,
            success_rate: data.gameState.score > 0 ? (data.gameState.score / data.clickCount) * 100 : 0
          }));
          break;
          
        case 'test_click':
          addLog(`Test click ${data.success ? 'successful' : 'failed'}. Score: ${data.gameState.score}`);
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-4), `[${timestamp}] ${message}`]);
  };

  const startBot = () => {
    if (webViewRef) {
      webViewRef.postMessage(`GameBot.start('${strategy}')`);
    }
  };

  const stopBot = () => {
    if (webViewRef) {
      webViewRef.postMessage('GameBot.stop()');
    }
  };

  const testClick = () => {
    if (webViewRef) {
      webViewRef.postMessage('GameBot.test()');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <Text style={styles.title}>🤖 NEAT Game Bot</Text>
        <View style={[styles.statusIndicator, { backgroundColor: botActive ? '#10b981' : '#6b7280' }]}>
          <Text style={styles.statusText}>{botActive ? 'Active' : 'Stopped'}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Game URL Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game URL</Text>
          <TextInput
            style={styles.input}
            value={gameUrl}
            onChangeText={setGameUrl}
            placeholder="Enter game URL..."
            placeholderTextColor="#6b7280"
          />
        </View>

        {/* Strategy Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Strategy</Text>
          <View style={styles.strategyContainer}>
            {strategies.map((strat) => (
              <TouchableOpacity
                key={strat}
                style={[styles.strategyButton, strategy === strat && styles.strategyActive]}
                onPress={() => setStrategy(strat)}
              >
                <Text style={[styles.strategyText, strategy === strat && styles.strategyTextActive]}>
                  {strat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.section}>
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={startBot}
              disabled={botActive}
            >
              <Text style={styles.buttonText}>Start Bot</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopBot}
              disabled={!botActive}
            >
              <Text style={styles.buttonText}>Stop Bot</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={testClick}
            >
              <Text style={styles.buttonText}>Test Click</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Clicks</Text>
              <Text style={styles.statValue}>{stats.clicks}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>{stats.score}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Success Rate</Text>
              <Text style={styles.statValue}>{stats.success_rate.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Game WebView */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game View</Text>
          <View style={styles.webviewContainer}>
            <Text style={styles.webviewPlaceholder}>
              WebView będzie tutaj po zainstalowaniu react-native-webview
              {'\n\n'}URL: {gameUrl}
              {'\n'}Strategia: {strategy}
              {'\n'}Status: {botActive ? 'Aktywny' : 'Zatrzymany'}
            </Text>
          </View>
        </View>

        {/* Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          <View style={styles.logsContainer}>
            {logs.length === 0 ? (
              <Text style={styles.logEmpty}>No activity yet...</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logText}>{log}</Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  strategyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  strategyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  strategyActive: {
    backgroundColor: '#3b82f6',
  },
  strategyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  strategyTextActive: {
    color: '#ffffff',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  testButton: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  webviewContainer: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#374151',
  },
  webview: {
    flex: 1,
  },
  webviewPlaceholder: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  logsContainer: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
  },
  logEmpty: {
    color: '#6b7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
  logText: {
    color: '#d1d5db',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});