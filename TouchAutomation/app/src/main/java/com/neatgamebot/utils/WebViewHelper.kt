package com.neatgamebot.utils

import android.annotation.SuppressLint
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient

object WebViewHelper {
    
    @SuppressLint("SetJavaScriptEnabled")
    fun setupWebView(webView: WebView, onUrlChanged: ((String) -> Unit)? = null) {
        webView.apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                loadWithOverviewMode = false
                useWideViewPort = false
                builtInZoomControls = false
                displayZoomControls = false
                setSupportZoom(false)
                allowFileAccess = true
                allowContentAccess = true
                mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                // Portrait mode optimizations
                layoutAlgorithm = android.webkit.WebSettings.LayoutAlgorithm.SINGLE_COLUMN
                textZoom = 100
                defaultFontSize = 16
            }
            
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                    url?.let { 
                        view?.loadUrl(it)
                        onUrlChanged?.invoke(it)
                    }
                    return true
                }
                
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    url?.let { onUrlChanged?.invoke(it) }
                }
            }
            
            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    super.onProgressChanged(view, newProgress)
                    // Progress updates can be handled here if needed
                }
            }
            
            // Inject bot detection JavaScript
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    
                    // Inject JavaScript for game state detection
                    val javascript = """
                        (function() {
                            // Game state detection helper
                            window.GameStateDetector = {
                                getScore: function() {
                                    const text = document.body.innerText;
                                    const scoreMatch = text.match(/score[:\s]*(\d+)/i) || text.match(/^(\d+)$/);
                                    return scoreMatch ? parseInt(scoreMatch[1]) : 0;
                                },
                                
                                isGameStarted: function() {
                                    const text = document.body.innerText.toLowerCase();
                                    return !text.includes('tap to start') && 
                                           !text.includes('click to start') && 
                                           !text.includes('get ready');
                                },
                                
                                isGameOver: function() {
                                    const text = document.body.innerText.toLowerCase();
                                    return text.includes('game over') || 
                                           text.includes('try again') || 
                                           text.includes('restart');
                                },
                                
                                findRestartButton: function() {
                                    // Look for restart button by text content
                                    const buttons = document.querySelectorAll('button, div[onclick], span[onclick], .button');
                                    for (let btn of buttons) {
                                        const text = btn.innerText.toLowerCase();
                                        if (text.includes('restart') || text.includes('try again') || text.includes('play again')) {
                                            const rect = btn.getBoundingClientRect();
                                            return {
                                                x: rect.left + rect.width / 2,
                                                y: rect.top + rect.height / 2,
                                                text: btn.innerText
                                            };
                                        }
                                    }
                                    return null;
                                },
                                
                                clickRestartIfFound: function() {
                                    const restartBtn = this.findRestartButton();
                                    if (restartBtn) {
                                        document.elementFromPoint(restartBtn.x, restartBtn.y)?.click();
                                        return restartBtn;
                                    }
                                    return null;
                                }
                            };
                            
                            // Make detection results available
                            window.gameState = {
                                score: window.GameStateDetector.getScore(),
                                started: window.GameStateDetector.isGameStarted(),
                                gameOver: window.GameStateDetector.isGameOver(),
                                restartButton: window.GameStateDetector.findRestartButton()
                            };
                        })();
                    """.trimIndent()
                    
                    view?.evaluateJavascript(javascript, null)
                    onUrlChanged?.invoke(url ?: "")
                }
            }
        }
    }
}
