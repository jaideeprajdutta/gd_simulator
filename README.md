
<blockquote>
  <strong>Note:</strong> This file documents the complete WebSocket communication architecture, data flow, and component responsibilities for the Group Discussion Simulator project. Generated from static code analysis.
</blockquote>

<hr>

<h2>1. WebSocket Connection Points</h2>

<table>
  <thead>
    <tr>
      <th>Location</th>
      <th>File:Line</th>
      <th>Used?</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>connectWs()</code> inline</td>
      <td><code>src/App.jsx:34</code></td>
      <td><strong>YES</strong> — primary active connection</td>
    </tr>
    <tr>
      <td><code>useWebSocket()</code> hook</td>
      <td><code>src/hooks/useWebSocket.js:15</code></td>
      <td><strong>NO</strong> — defined but unused (App.jsx has its own inline implementation)</td>
    </tr>
    <tr>
      <td>Server <code>wss.on('connection')</code></td>
      <td><code>server.cjs:347</code></td>
      <td><strong>YES</strong> — accepts all client connections</td>
    </tr>
  </tbody>
</table>

<hr>

<h2>2. Every <code>ws.send()</code> Call</h2>

<h3>Frontend → Backend (Client Sends)</h3>
<table>
  <thead>
    <tr>
      <th>Caller</th>
      <th>File:Line</th>
      <th>Message</th>
      <th>Payload</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>sendWs()</code> immediate</td>
      <td><code>src/App.jsx:83</code></td>
      <td>Any</td>
      <td><code>JSON.stringify(data)</code></td>
    </tr>
    <tr>
      <td><code>sendWs()</code> open-fallback</td>
      <td><code>src/App.jsx:89</code></td>
      <td>Any (queued)</td>
      <td><code>JSON.stringify(data)</code></td>
    </tr>
    <tr>
      <td><code>handleStart()</code></td>
      <td><code>src/App.jsx:269</code></td>
      <td><code>START_SIMULATION</code></td>
      <td><code>{ type, topic }</code></td>
    </tr>
    <tr>
      <td><code>handleUserInterrupt()</code></td>
      <td><code>src/App.jsx:273</code></td>
      <td><code>USER_INTERRUPT</code></td>
      <td><code>{ type }</code> ⚠️ Dead code</td>
    </tr>
    <tr>
      <td><code>handleSendMessage()</code></td>
      <td><code>src/App.jsx:277</code></td>
      <td><code>USER_MESSAGE</code></td>
      <td><code>{ type, text }</code></td>
    </tr>
  </tbody>
</table>

<h3>Backend → Frontend (Server Sends)</h3>
<table>
  <thead>
    <tr>
      <th>Caller</th>
      <th>File:Line</th>
      <th>Message</th>
      <th>Payload</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Connection handler</td>
      <td><code>server.cjs:378</code></td>
      <td><code>CONNECTED</code></td>
      <td><code>{ type }</code></td>
    </tr>
    <tr>
      <td><code>Simulation.send()</code></td>
      <td><code>server.cjs:205</code></td>
      <td>Any</td>
      <td><code>JSON.stringify(event)</code></td>
    </tr>
  </tbody>
</table>

<hr>

<h2>3. Every <code>ws.onmessage</code> Handler</h2>

<h3>Frontend</h3>
<table>
  <thead>
    <tr>
      <th>Handler</th>
      <th>File:Line</th>
      <th>Behavior</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>ws.onmessage</code></td>
      <td><code>src/App.jsx:40-51</code></td>
      <td>Parses JSON, dispatches to <code>listenersRef</code> Map by message <code>type</code> (and <code>'*'</code> wildcard)</td>
    </tr>
  </tbody>
</table>

<h3>Backend</h3>
<table>
  <thead>
    <tr>
      <th>Handler</th>
      <th>File:Line</th>
      <th>Behavior</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>ws.on('message')</code></td>
      <td><code>server.cjs:350-371</code></td>
      <td>Parses JSON, routes by <code>msg.type</code> to <code>START_SIMULATION</code> / <code>STOP_SIMULATION</code> / <code>USER_MESSAGE</code></td>
    </tr>
    <tr>
      <td><code>ws.on('close')</code></td>
      <td><code>server.cjs:373-376</code></td>
      <td>Stops current simulation if one is active</td>
    </tr>
  </tbody>
</table>

<hr>

<h2>4. Complete Message Type Catalog</h2>

<h3>Client → Server (3 types emitted, 2 handled)</h3>
<table>
  <thead>
    <tr>
      <th>Message Type</th>
      <th>Sent From</th>
      <th>Handled By</th>
      <th>Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>START_SIMULATION</code></td>
      <td><code>App.jsx:269</code></td>
      <td><code>server.cjs:354</code></td>
      <td>Start a GD with a given <code>topic</code></td>
    </tr>
    <tr>
      <td><code>USER_MESSAGE</code></td>
      <td><code>App.jsx:277</code></td>
      <td><code>server.cjs:365</code></td>
      <td>Send user's typed/speech text response</td>
    </tr>
    <tr>
      <td><code>USER_INTERRUPT</code></td>
      <td><code>App.jsx:273</code></td>
      <td><strong>⚠️ No handler — dead code</strong></td>
      <td>Intended to interrupt AI speaking</td>
    </tr>
    <tr>
      <td><code>STOP_SIMULATION</code></td>
      <td><em>(never sent from frontend)</em></td>
      <td><code>server.cjs:361</code></td>
      <td>Stop simulation (no UI button for it)</td>
    </tr>
  </tbody>
</table>

<h3>Server → Client (10 types)</h3>
<table>
  <thead>
    <tr>
      <th>Message Type</th>
      <th>Sent From (server.cjs)</th>
      <th>Frontend Listener</th>
      <th>Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>CONNECTED</code></td>
      <td><code>:378</code></td>
      <td><code>ws.onopen</code> (:37)</td>
      <td>Confirms WebSocket opened</td>
    </tr>
    <tr>
      <td><code>SIMULATION_START</code></td>
      <td><code>:211</code></td>
      <td><code>App.jsx:232</code></td>
      <td>Simulation has begun with topic</td>
    </tr>
    <tr>
      <td><code>SPEAK</code></td>
      <td><code>:239</code></td>
      <td><code>App.jsx:179</code>, <code>GDScene.jsx:48</code></td>
      <td>AI participant is speaking (text + metadata)</td>
    </tr>
    <tr>
      <td><code>SPEAK_AUDIO</code></td>
      <td><code>:257</code></td>
      <td><code>App.jsx:196</code></td>
      <td>URL to generated TTS audio file</td>
    </tr>
    <tr>
      <td><code>STOP_SPEAKING</code></td>
      <td><code>:268</code></td>
      <td><code>App.jsx:204</code>, <code>GDScene.jsx:66</code></td>
      <td>Current speaker finished</td>
    </tr>
    <tr>
      <td><code>WAITING_FOR_USER</code></td>
      <td><code>:299</code></td>
      <td><code>App.jsx:217</code>, <code>GDScene.jsx:69</code></td>
      <td>Every 3rd turn — user invited to speak</td>
    </tr>
    <tr>
      <td><code>USER_TIMEOUT</code></td>
      <td><code>:304</code></td>
      <td><code>App.jsx:227</code></td>
      <td>User didn't respond in 30s</td>
    </tr>
    <tr>
      <td><code>SIMULATION_END</code></td>
      <td><code>:291,338</code></td>
      <td><code>App.jsx:235</code>, <code>GDScene.jsx:75</code></td>
      <td>Simulation finished or stopped</td>
    </tr>
    <tr>
      <td><code>SIMULATION_ERROR</code></td>
      <td><code>:288</code></td>
      <td><strong>⚠️ Unhandled</strong></td>
      <td>3 consecutive LLM errors</td>
    </tr>
    <tr>
      <td><code>ERROR</code></td>
      <td><code>:282</code></td>
      <td><strong>⚠️ Unhandled</strong></td>
      <td>Per-turn LLM error</td>
    </tr>
  </tbody>
</table>

<hr>

<h2>5. Message Exchange Table</h2>

<table>
  <thead>
    <tr>
      <th>MESSAGE TYPE</th>
      <th>SENDER</th>
      <th>RECEIVER</th>
      <th>PAYLOAD</th>
      <th>FILES INVOLVED</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>START_SIMULATION</code></td>
      <td>App.jsx <code>handleStart()</code></td>
      <td>server.cjs <code>ws.on('message')</code></td>
      <td><code>{ type, topic }</code></td>
      <td><code>App.jsx:269</code>, <code>server.cjs:354</code></td>
    </tr>
    <tr>
      <td><code>USER_MESSAGE</code></td>
      <td>App.jsx <code>handleSendMessage()</code></td>
      <td>server.cjs <code>Simulation.handleUserMessage()</code></td>
      <td><code>{ type, text }</code></td>
      <td><code>App.jsx:277</code>, <code>server.cjs:365</code></td>
    </tr>
    <tr>
      <td><code>USER_INTERRUPT</code></td>
      <td>App.jsx <code>handleUserInterrupt()</code></td>
      <td><em>(unhandled)</em></td>
      <td><code>{ type }</code></td>
      <td><code>App.jsx:273</code></td>
    </tr>
    <tr>
      <td><code>STOP_SIMULATION</code></td>
      <td><em>(never sent from frontend)</em></td>
      <td>server.cjs <code>ws.on('message')</code></td>
      <td><code>{ type }</code></td>
      <td><code>server.cjs:361</code></td>
    </tr>
    <tr>
      <td><code>CONNECTED</code></td>
      <td>server.cjs on connect</td>
      <td>App.jsx <code>ws.onopen</code></td>
      <td><code>{ type }</code></td>
      <td><code>server.cjs:378</code>, <code>App.jsx:37</code></td>
    </tr>
    <tr>
      <td><code>SIMULATION_START</code></td>
      <td>server.cjs <code>Simulation.start()</code></td>
      <td>App.jsx <code>handleGdEvent()</code> → GDOverlay</td>
      <td><code>{ type, topic }</code></td>
      <td><code>server.cjs:211</code>, <code>App.jsx:232</code></td>
    </tr>
    <tr>
      <td><code>SPEAK</code></td>
      <td>server.cjs <code>Simulation.start()</code></td>
      <td>App.jsx <code>handleGdEvent()</code>, GDScene</td>
      <td><code>{ type, speaker, speakerName, seatIndex, target, text, emotion, intent, phase, turn }</code></td>
      <td><code>server.cjs:239</code>, <code>App.jsx:179</code>, <code>GDScene.jsx:48</code></td>
    </tr>
    <tr>
      <td><code>SPEAK_AUDIO</code></td>
      <td>server.cjs <code>generateAudio()</code> callback</td>
      <td>App.jsx <code>handleGdEvent()</code> → <code>playAudio()</code></td>
      <td><code>{ type, speaker, url, duration }</code></td>
      <td><code>server.cjs:257</code>, <code>App.jsx:196</code></td>
    </tr>
    <tr>
      <td><code>STOP_SPEAKING</code></td>
      <td>server.cjs timeout callback</td>
      <td>App.jsx <code>handleGdEvent()</code>, GDScene</td>
      <td><code>{ type, speaker }</code></td>
      <td><code>server.cjs:268</code>, <code>App.jsx:204</code>, <code>GDScene.jsx:66</code></td>
    </tr>
    <tr>
      <td><code>WAITING_FOR_USER</code></td>
      <td>server.cjs <code>Simulation._askUser()</code></td>
      <td>App.jsx → GDOverlay, GDScene</td>
      <td><code>{ type, turn }</code></td>
      <td><code>server.cjs:299</code>, <code>App.jsx:217</code>, <code>GDScene.jsx:69</code></td>
    </tr>
    <tr>
      <td><code>USER_TIMEOUT</code></td>
      <td>server.cjs <code>Simulation._askUser()</code></td>
      <td>App.jsx <code>handleGdEvent()</code></td>
      <td><code>{ type }</code></td>
      <td><code>server.cjs:304</code>, <code>App.jsx:227</code></td>
    </tr>
    <tr>
      <td><code>SIMULATION_END</code></td>
      <td>server.cjs <code>Simulation.start()/stop()</code></td>
      <td>App.jsx <code>handleGdEvent()</code>, GDScene</td>
      <td><code>{ type, turnCount }</code></td>
      <td><code>server.cjs:291,338</code>, <code>App.jsx:235</code>, <code>GDScene.jsx:75</code></td>
    </tr>
    <tr>
      <td><code>SIMULATION_ERROR</code></td>
      <td>server.cjs error guard</td>
      <td><em>(unhandled)</em></td>
      <td><code>{ type, message }</code></td>
      <td><code>server.cjs:288</code></td>
    </tr>
    <tr>
      <td><code>ERROR</code></td>
      <td>server.cjs catch block</td>
      <td><em>(unhandled)</em></td>
      <td><code>{ type, message }</code></td>
      <td><code>server.cjs:282</code></td>
    </tr>
  </tbody>
</table>

<hr>

<h2>6. Sequence Diagrams</h2>

<h3>Starting a Simulation</h3>
<pre><code>User                    Frontend                    Backend               OpenRouter          Python/TTS
 │                        │                           │                      │                    │
 │  click "Start"         │                           │                      │                    │
 │──────────────────────► │                           │                      │                    │
 │                        │  WS: START_SIMULATION(topic)                     │                    │
 │                        │─────────────────────────► │                      │                    │
 │                        │                           │  new Simulation()    │                    │
 │                        │                           │  start()             │                    │
 │                        │  WS: SIMULATION_START     │                      │                    │
 │                        │◄───────────────────────── │                      │                    │
 │                        │                           │  chooseWeighted()    │                    │
 │                        │                           │  buildPrompt()       │                    │
 │                        │                           │  chat completions    │                    │
 │                        │                           │─────────────────────►│                    │
 │                        │                           │◄──── response ──────│                    │</code></pre>

<h3>AI Participant Speaking + TTS</h3>
<pre><code>Frontend                    Backend               OpenRouter          Python/TTS
 │                           │                      │                    │
 │                           │  openai.chat...()    │                    │
 │                           │─────────────────────►│                    │
 │                           │◄──── response ───────│                    │
 │  WS: SPEAK(payload)       │                      │                    │
 │◄──────────────────────────│                      │                    │
 │  [setSpeakerInfo]         │                      │                    │
 │  [GDScene: eye contact]   │                      │                    │
 │                           │  spawn('python',     │                    │
 │                           │    '-m edge_tts...') │                    │
 │                           │─────────────────────────────────────────► │
 │                           │◄─── file written ─────────────────────── │
 │  WS: SPEAK_AUDIO(url)     │                      │                    │
 │◄──────────────────────────│                      │                    │
 │  [playAudio()]            │                      │                    │
 │  [new Audio(url)]         │                      │                    │
 │  [gdEventBus: START_TALKING]                     │                    │
 │  [Avatar: jaw morph]      │                      │                    │
 │  [audio.onended]          │                      │                    │
 │  [gdEventBus: STOP_TALKING]                      │                    │
 │  WS: STOP_SPEAKING        │                      │                    │
 │◄──────────────────────────│                      │                    │</code></pre>

<h3>User Interruption</h3>
<pre><code>User                    Frontend                    Backend
 │                        │                           │
 │  [Every 3rd turn]      │  WS: WAITING_FOR_USER     │
 │                        │◄─────────────────────────│
 │                        │  [GDOverlay: "Your turn"] │
 │  type/mic              │                           │
 │──────────────────────► │                           │
 │                        │  WS: USER_MESSAGE(text)   │
 │                        │─────────────────────────►│
 │                        │                           │  handleUserMessage()
 │                        │                           │  → clear timeout
 │                        │                           │  → resolve _askUser()
 │                        │  WS: SPEAK(next AI)       │
 │                        │◄─────────────────────────│</code></pre>

<h3>Simulation Ending</h3>
<pre><code>Backend                                     Frontend
 │                                            │
 │  [phase > conclusion OR 3 errors]          │
 │  WS: SIMULATION_END(turnCount)            │
 │──────────────────────────────────────────►│
 │  [currentSimulation = null]                │
 │                                            │  → pause audio
 │                                            │  → reset speakerInfo
 │                                            │  → gdEventBus(STOP_TALKING)
 │                                            │  → GDScene: clear look targets
 │                                            │  → GDOverlay: idle state</code></pre>

<hr>

<h2>7. Full Data Flow Trace</h2>
<pre><code>USER
 │
 │   Topic input / Text message / Mic click
 ▼
FRONTEND (App.jsx)
 │
 ├── handleStart()          → sendWs({ START_SIMULATION, topic })
 ├── handleSendMessage()    → sendWs({ USER_MESSAGE, text })
 ├── handleUserInterrupt()  → sendWs({ USER_INTERRUPT })  ← dead code
 │
 ▼
WebSocket (ws://hostname:3000/ws)
 │
 ▼
BACKEND (server.cjs)
 │
 ├── Simulation.start()
 │   │
 │   ├── chooseWeighted(PARTICIPANTS)  → picks speaker by probability
 │   ├── buildPrompt(...)              → constructs LLM prompt
 │   │
 │   ▼
 │   OpenRouter API (openai/gpt-4o-mini)
 │   │
 │   ├── POST https://openrouter.ai/api/v1/chat/completions
 │   │
 │   ◄── response.choices[0].message.content
 │   │
 │   ▼
 │   Simulation.send({ SPEAK, speaker, text, emotion, ... })  → WebSocket
 │   │
 │   ▼
 │   generateAudio(text, speakerId)      ← async
 │   │
 │   ├── spawn('python', [
 │   │     '-m', 'edge_tts',
 │   │     '--voice', VOICE_MAP[id],
 │   │     '--text', text,
 │   │     '--write-media', 'dist/audio/turn_N.mp3'
 │   │   ])
 │   │
 │   ▼
 │   Python / edge_tts (Microsoft Edge TTS)
 │   │
 │   ◄── writes .mp3 file
 │   │
 │   Simulation.send({ SPEAK_AUDIO, url: '/audio/turn_N.mp3' })  → WS
 │   │
 │   ▼
 │   [timeout] → Simulation.send({ STOP_SPEAKING })
 │
 ▼
WebSocket
 │
 ▼
FRONTEND (App.jsx)
 │
 ├── onWsEvent('SPEAK')
 │   ├── setSpeakerInfo({ currentSpeaker, currentText, isSpeaking })
 │   │   → GDOverlay: speech bubble
 │   └── (audioUrl field unused here)
 │
 ├── onWsEvent('SPEAK_AUDIO')
 │   └── playAudio(url, seatIndex, emotion)
 │       │
 │       ├── gdEventBus.emit({ type: 'START_TALKING', seatIndex, emotion })
 │       │   │
 │       │   ▼  GDScene subscribes to gdEventBus
 │       │   → setTalkingSpeakerIndex(seatIndex)
 │       │   → getController(seatIndex).startTalking()
 │       │   → getController(seatIndex).setEmotion(emotion)
 │       │       │
 │       │       ▼  AvatarController (Avatar.jsx → AvatarController.js)
 │       │       ├── startTalking()   → isTalking = true
 │       │       ├── setEmotion()     → morph targets → expression preset
 │       │       └── update(delta)    → jaw morph + blink + head tracking
 │       │
 │       ├── new Audio(url)
 │       │   onplay  → gdEventBus('START_TALKING')
 │       │   onended → gdEventBus('STOP_TALKING')
 │       │   onerror → fallback timer
 │       │
 │       └── (audio plays through browser)
 │
 ├── onWsEvent('STOP_SPEAKING')
 │   └── if audio done: clear speakerInfo, emit STOP_TALKING
 │
 ├── onWsEvent('WAITING_FOR_USER')
 │   └── set waitingForUser → GDOverlay: input prompt
 │
 └── onWsEvent('SIMULATION_END')
     └── cleanup: pause audio, reset state, emit STOP_TALKING</code></pre>

<hr>

<h2>8. Architecture Responsibilities</h2>

<h3>State Management</h3>
<table>
  <thead>
    <tr>
      <th>Component</th>
      <th>Owns</th>
      <th>Mechanism</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>App.jsx</strong></td>
      <td><code>speakerInfo</code> (currentSpeaker, currentText, isSpeaking, waitingForUser, connected), <code>isListening</code>, <code>isAudioPlaying</code>, <code>topic</code></td>
      <td><code>useState</code> + <code>useRef</code> (wsRef, listenersRef, audioRef, currentSpeakerRef, isAudioPlayingRef, micQueuedRef)</td>
    </tr>
    <tr>
      <td><strong>GDOverlay.jsx</strong></td>
      <td><code>inputText</code>, <code>topicText</code>, <code>chatHistory[]</code>, <code>volumeLevel</code>, <code>simStarted</code>, <code>showTopicInput</code></td>
      <td><code>useState</code></td>
    </tr>
    <tr>
      <td><strong>GDScene.jsx</strong></td>
      <td><code>lookSpeakerIndex</code>, <code>lookTargetIndex</code>, <code>talkingSpeakerIndex</code>, <code>currentEmotion</code></td>
      <td><code>useState</code></td>
    </tr>
    <tr>
      <td><strong>AvatarController.js</strong></td>
      <td><code>isTalking</code>, morph target weights, head rotation quaternion, blink timer</td>
      <td>Class instance properties</td>
    </tr>
  </tbody>
</table>

<h3>Event Bus Usage (<code>gdEventBus</code>)</h3>
<p><strong>Purpose:</strong> Synchronizes audio playback timing with 3D avatar animation (decoupled from React render cycle).</p>
<p><strong>File:</strong> <code>src/utils/eventBus.js</code> — simple pub/sub with <code>Set</code> of listeners.</p>

<table>
  <thead>
    <tr>
      <th>Direction</th>
      <th>File:Line</th>
      <th>Event</th>
      <th>Effect</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Emit</strong></td>
      <td><code>App.jsx:128,148,166</code></td>
      <td><code>START_TALKING</code></td>
      <td>Triggers avatar animation via GDScene</td>
    </tr>
    <tr>
      <td><strong>Emit</strong></td>
      <td><code>App.jsx:116,134,151,169,211,243</code></td>
      <td><code>STOP_TALKING</code></td>
      <td>Stops avatar animation</td>
    </tr>
    <tr>
      <td><strong>Subscribe</strong></td>
      <td><code>GDScene.jsx:86-100</code></td>
      <td>Both</td>
      <td>Sets <code>talkingSpeakerIndex</code> + <code>currentEmotion</code> on scene state</td>
    </tr>
  </tbody>
</table>

<h3>WebSocket Responsibilities</h3>
<table>
  <thead>
    <tr>
      <th>Layer</th>
      <th>File:Line</th>
      <th>Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Backend</strong></td>
      <td><code>server.cjs:347-379</code></td>
      <td>Accept connections at <code>/ws</code>, route incoming messages to Simulation, manage lifecycle, handle disconnect</td>
    </tr>
    <tr>
      <td><strong>Frontend</strong></td>
      <td><code>src/App.jsx:30-93</code></td>
      <td>Connect on mount, auto-reconnect every 3s on disconnect, <code>sendWs()</code> sends JSON, <code>onWsEvent()</code> provides pub/sub registration, <code>handleGdEvent()</code> central dispatch</td>
    </tr>
  </tbody>
</table>

<h3>Audio Responsibilities</h3>
<table>
  <thead>
    <tr>
      <th>Layer</th>
      <th>File:Line</th>
      <th>Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Backend</strong></td>
      <td><code>server.cjs:126-156</code></td>
      <td><code>generateAudio()</code> — spawn Python <code>edge_tts</code>, write <code>.mp3</code> to <code>dist/audio/</code>, return URL or null</td>
    </tr>
    <tr>
      <td><strong>Frontend</strong></td>
      <td><code>src/App.jsx:106-175</code></td>
      <td><code>playAudio()</code> — manage HTML5 Audio lifecycle, handle success/failure/fallback, coordinate event bus for animation sync</td>
    </tr>
  </tbody>
</table>

<h3>Avatar Responsibilities</h3>
<table>
  <thead>
    <tr>
      <th>Component</th>
      <th>File</th>
      <th>Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>GDScene.jsx</strong></td>
      <td><code>src/scenes/GDScene.jsx</code></td>
      <td>Orchestrates 5 avatars; reacts to WS events + event bus to set look targets, talking state, emotion</td>
    </tr>
    <tr>
      <td><strong>Avatar.jsx</strong></td>
      <td><code>src/components/Avatar.jsx</code></td>
      <td>Loads GLB model, registers controller in registry, passes per-frame updates via <code>useFrame</code>, handles eye contact via <code>useEffect</code></td>
    </tr>
    <tr>
      <td><strong>AvatarController.js</strong></td>
      <td><code>src/components/AvatarController.js</code></td>
      <td>Pure class (no React): jaw morph oscillation, emotion morph target lerp, head bone slerp rotation, per-frame blink timer</td>
    </tr>
    <tr>
      <td><strong>useAvatarController.js</strong></td>
      <td><code>src/hooks/useAvatarController.js</code></td>
      <td>Registry pattern: <code>register(seatIndex, controller)</code> / <code>getController(seatIndex)</code></td>
    </tr>
  </tbody>
</table>

<hr>

<h2>9. Architecture Overview</h2>

<h3>High-Level Picture</h3>
<pre><code>┌─────────────────────────────────────────────────────────────────┐
│                       BROWSER (React + Three.js)                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  App.jsx (Orchestrator)                                  │   │
│  │  ├── WebSocket connection manager                        │   │
│  │  ├── Audio playback manager                              │   │
│  │  ├── State hub (speakerInfo, topic, etc.)                │   │
│  │  └── Event registration (onWsEvent)                      │   │
│  └──────────┬───────────────────────────────────────────────┘   │
│             │                                                   │
│    ┌────────┴────────┐          ┌──────────────────────┐        │
│    │  GDOverlay.jsx  │          │  GDScene.jsx         │        │
│    │  (UI layer)     │          │  (3D orchestrator)   │        │
│    │  topic input    │          │  ┌────────────────┐  │        │
│    │  speech bubble  │          │  │ Avatar.jsx x5  │  │        │
│    │  chat log       │          │  │  └─ AvCtrl.js  │  │        │
│    │  mic button     │          │  │ ← gdEventBus   │  │        │
│    └─────────────────┘          │  └────────────────┘  │        │
│                                 └──────────────────────┘        │
│                                          ▲                      │
│                                     gdEventBus (pub/sub)        │
└──────────────────────────────────────┬───────────────────────────┘
                                       │ WebSocket (ws://:3000/ws)
                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NODE.JS SERVER (server.cjs)                  │
│                                                                 │
│  Express 5 + ws (WebSocket) + Simulation engine                 │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Simulation class (one instance per connected client)      │ │
│  │  ├── Weighted random speaker selection                     │ │
│  │  ├── Prompt builder (personality + history)                │ │
│  │  ├── Phase engine: opening → debate → conclusion           │ │
│  │  └── Turn counter / user wait (every 3rd turn)             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           │                                     │
│              ┌────────────┴────────────┐                        │
│              ▼                         ▼                        │
│   OpenRouter API (LLM)       Python edge_tts (TTS)              │
│   gpt-4o-mini                 → writes .mp3 to dist/audio/      │
└─────────────────────────────────────────────────────────────────┘</code></pre>

<h3>Data Flow (Simplified)</h3>
<ol>
  <li><strong>User clicks "Start"</strong> → Frontend sends <code>START_SIMULATION</code> via WebSocket</li>
  <li><strong>Server starts a Simulation</strong> → Loop:
    <ul>
      <li>Pick a speaker by weighted probability</li>
      <li>Build a prompt with topic, personality, history, and intent</li>
      <li>Call <strong>OpenRouter API</strong> (gpt-4o-mini) to generate dialogue</li>
      <li>Send <code>SPEAK</code> event to frontend (text + emotion + target)</li>
      <li>Spawn <strong>Python edge_tts</strong> to generate audio</li>
      <li>Send <code>SPEAK_AUDIO</code> with the audio URL</li>
    </ul>
  </li>
  <li><strong>Frontend receives <code>SPEAK</code></strong> → Shows speech bubble, sets eye contact</li>
  <li><strong>Frontend receives <code>SPEAK_AUDIO</code></strong> → Plays audio, signals avatars via <code>gdEventBus</code></li>
  <li><strong>Every 3rd turn</strong> → Server sends <code>WAITING_FOR_USER</code> → User types or uses mic</li>
  <li><strong>Simulation ends</strong> after conclusion phase → <code>SIMULATION_END</code></li>
</ol>

<h3>Key Architectural Decisions</h3>
<table>
  <thead>
    <tr>
      <th>Decision</th>
      <th>Rationale</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Single <code>server.cjs</code></strong></td>
      <td>Simple for a prototype; no router/controller separation needed yet</td>
    </tr>
    <tr>
      <td><strong>Inline WebSocket (not the hook)</strong></td>
      <td>App.jsx predates <code>useWebSocket.js</code> — technical debt to resolve</td>
    </tr>
    <tr>
      <td><strong>Event bus for avatar animation</strong></td>
      <td>Decouples audio timing from React re-renders (animations run at 60fps, React at ~30fps)</td>
    </tr>
    <tr>
      <td><strong>Listener map pattern</strong></td>
      <td>Custom <code>onWsEvent</code> pub/sub instead of global state library (Redux/Zustand) — lightweight</td>
    </tr>
    <tr>
      <td><strong>Weighted random speakers</strong></td>
      <td>Avoids deterministic/predictable turn order; mimics real GD dynamics</td>
    </tr>
    <tr>
      <td><strong>Python TTS subprocess</strong></td>
      <td><code>edge_tts</code> is free and runs locally; avoids cloud TTS costs</td>
    </tr>
    <tr>
      <td><strong>No test framework</strong></td>
      <td>Manual testing via <code>tests/</code> Python scripts only</td>
    </tr>
  </tbody>
</table>

<h3>Known Technical Debt</h3>
<ol>
  <li><strong><code>USER_INTERRUPT</code></strong> (<code>App.jsx:273</code>) is sent but server has no handler for it</li>
  <li><strong><code>SIMULATION_ERROR</code> / <code>ERROR</code></strong> server events are never handled on the frontend</li>
  <li><strong><code>useWebSocket.js</code></strong> hook is defined but unused — App.jsx duplicates its logic inline</li>
  <li><strong><code>cors</code> package</strong> in <code>package.json</code> is installed but <code>server.cjs</code> never calls <code>cors()</code></li>
  <li><strong>Inconsistent <code>audioUrl</code></strong> — <code>SPEAK</code> handler checks <code>event.audioUrl</code> (line 190) but server never includes it; audio always arrives via <code>SPEAK_AUDIO</code></li>
  <li><strong><code>STOP_SIMULATION</code></strong> is never sent from the frontend — no "Stop" button exists in UI</li>
</ol>
