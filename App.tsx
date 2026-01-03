// App.tsx
import React, { useState, useEffect } from "react";
import { GameState, MultiPlayerMessage, MatchRecord } from "./types";
import { StartScreen } from "./components/StartScreen/StartScreen";
import { Game } from "./components/Game";
import { GameOverScreen } from "./components/GameOverScreen";
import { LobbyScreen } from "./components/LobbyScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { AVATARS, GAME_DURATION_SECONDS } from "./constants";
import { db } from "./firebaseConfig";
import {
  ref,
  set,
  update,
  onValue,
  push,
  remove,
  onDisconnect,
  child,
  get,
  serverTimestamp,
  onChildAdded,
} from "firebase/database";
import { ThemeType } from "./components/StartScreen/SettingsModal";

interface MockConnection {
  send: (data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  close: () => void;
  open: boolean;
}

export default function App() {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [finalScore, setFinalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Connection
  const [roomId, setRoomId] = useState<string | null>(null);
  const [conn, setConn] = useState<MockConnection | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Player Info
  const [myName, setMyName] = useState("Bạn");
  const [myAvatar, setMyAvatar] = useState(AVATARS[0]);
  const [opponentName, setOpponentName] = useState("Đối thủ");
  const [opponentAvatar, setOpponentAvatar] = useState("👤");
  const [opponentScore, setOpponentScore] = useState(0);

  // Role: Host hay Guest
  const [isHost, setIsHost] = useState(false);

  // Trạng thái Restart
  const [isMeReady, setIsMeReady] = useState(false);

  // ID phiên chơi
  const [gameSessionId, setGameSessionId] = useState<number>(Date.now());

  const [matchDuration, setMatchDuration] = useState(0);
  const [matchItemsCount, setMatchItemsCount] = useState(0);

  const [appTheme, setAppTheme] = useState<ThemeType>('DEFAULT');

  useEffect(() => {
    const savedTheme = localStorage.getItem('mango-theme');
    if (savedTheme === 'PIXEL' || savedTheme === 'PAPER') {
       setAppTheme(savedTheme as ThemeType);
    }
  }, []);

  // Init
  useEffect(() => {
    const saved = localStorage.getItem("mango-sum10-highscore");
    if (saved) setHighScore(parseInt(saved, 10));

    const savedName = localStorage.getItem("mango-player-name");
    if (savedName) setMyName(savedName);

    const savedAvatarRaw = localStorage.getItem("mango-player-avatar");
    if (savedAvatarRaw) {
      try {
        const parsed = JSON.parse(savedAvatarRaw);

        // Tìm avatar trong danh sách có 'value' trùng khớp
        const found = AVATARS.find((a) => a.value === parsed.value);
        if (found) setMyAvatar(found);
      } catch (e) {
        // Tìm avatar trong danh sách có 'value' trùng với text đó
        const found = AVATARS.find((a) => a.value === savedAvatarRaw);
        if (found) setMyAvatar(found);
      }
    }
  }, []);

  // --- LẮNG NGHE TRẠNG THÁI RESTART TỪ DB ---
  useEffect(() => {
    if (isMultiplayer && gameState === GameState.GAME_OVER && roomId) {
      const restartRef = ref(db, `rooms/${roomId}/restart`);

      const unsubscribe = onValue(restartRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.host === true && data.guest === true) {
          console.log("[DEBUG] Both Ready -> Starting Match");
          startMultiplayerMatch();
        }
      });
      return () => unsubscribe();
    }
  }, [isMultiplayer, gameState, roomId]);

  useEffect(() => {
    if (gameState === GameState.LOBBY && roomId) {
      const role = isHost ? "host" : "guest";
      const userRef = ref(db, `rooms/${roomId}/${role}`);

      update(userRef, {
        name: myName,
        avatar: myAvatar,
      }).catch((err) => console.error("Sync error:", err));
    }
  }, [myName, myAvatar, gameState, roomId, isHost]);

  const startMultiplayerMatch = () => {
    if (roomId) {
      // Reset cờ restart
      update(ref(db, `rooms/${roomId}/restart`), { host: false, guest: false });

      // Việc này ngăn chặn lỗi "Reset game khi ghi điểm" do nhận nhầm tin nhắn cũ
      if (isHost) {
        remove(ref(db, `rooms/${roomId}/messages`));
      }
    }

    setGameSessionId(Date.now());
    setGameState(GameState.PLAYING);
    setOpponentScore(0);
    setFinalScore(0);
    setIsMeReady(false);
  };

  const generateRandom4Digit = () =>
    Math.floor(1000 + Math.random() * 9000).toString();

  const createFirebaseConnection = (
    currentRoomId: string,
    role: "host" | "guest"
  ) => {
    const messagesRef = ref(db, `rooms/${currentRoomId}/messages`);
    const listeners: Record<string, Function[]> = {
      data: [],
      close: [],
      open: [],
    };

    // Mốc thời gian bắt đầu kết nối
    const connectionStartTime = Date.now();

    // onChildAdded: Đảm bảo KHÔNG BAO GIỜ MẤT tin nhắn, xử lý từng cái một theo thứ tự
    const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
      const msg = snapshot.val();
      if (!msg) return;

      // Logic lọc tin nhắn:
      if (msg.sender !== role && msg.timestamp > connectionStartTime) {
        listeners["data"]?.forEach((cb) => cb(msg.payload));
      }
    });

    const mockConn: MockConnection = {
      open: true,
      send: (payload: any) => {
        push(messagesRef, {
          sender: role,
          payload: payload,
          timestamp: serverTimestamp(),
        });
      },
      on: (event: string, callback: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
        if (event === "open") setTimeout(() => callback(), 100);
      },
      off: (event: string) => {
        listeners[event] = [];
      },
      close: () => {
        unsubscribe();
        listeners["close"]?.forEach((cb) => cb());
        setConn(null);
      },
    };
    return mockConn;
  };

  const setupGameListeners = (connection: MockConnection) => {
    connection.on("data", (msg: MultiPlayerMessage) => {
      if (msg.type === "START") {
        if (msg.payload?.name) setOpponentName(msg.payload.name);
        if (msg.payload?.avatar) setOpponentAvatar(msg.payload.avatar);
      } else if (msg.type === "UPDATE_SCORE") {
        if (msg.payload.score !== undefined)
          setOpponentScore(msg.payload.score);
      } else if (msg.type === "PLAYER_FINISHED" || msg.type === "GAME_OVER") {
        if (msg.payload.score !== undefined)
          setOpponentScore(msg.payload.score);
      }
    });
  };

  // --- ACTIONS ---

  const handleOpenLobby = async () => {
    setIsMultiplayer(true);
    setGameState(GameState.LOBBY);
    const newRoomId = generateRandom4Digit();
    setRoomId(newRoomId);
    setIsHost(true);

    const roomRef = ref(db, `rooms/${newRoomId}`);
    await set(roomRef, {
      createdAt: serverTimestamp(),
      host: { name: myName, avatar: myAvatar, status: "WAITING" },
      status: "OPEN",
      restart: { host: false, guest: false },
    });
    onDisconnect(roomRef).remove();

    const guestRef = child(roomRef, "guest");
    onValue(guestRef, (snapshot) => {
      const guest = snapshot.val();
      if (guest) {
        setOpponentName(guest.name);
        setOpponentAvatar(guest.avatar);
        const connection = createFirebaseConnection(newRoomId, "host");
        setConn(connection);
        connection.send({
          type: "START",
          payload: { name: myName, avatar: myAvatar },
        } as MultiPlayerMessage);

        setupGameListeners(connection);
        startMultiplayerMatch();
      }
    });
  };

  const handleJoinGame = async (inputRoomId: string) => {
    if (inputRoomId.length !== 4) return alert("Mã phòng phải là 4 số!");
    setIsConnecting(true);
    const roomRef = ref(db, `rooms/${inputRoomId}`);
    try {
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) {
        setIsConnecting(false);
        return alert("Phòng không tồn tại!");
      }
      const roomData = snapshot.val();
      if (roomData.guest) {
        setIsConnecting(false);
        return alert("Phòng đã đầy!");
      }

      const hostRef = child(roomRef, "host");
      onValue(hostRef, (snap) => {
        const hostData = snap.val();
        if (hostData) {
          setOpponentName(hostData.name);
          setOpponentAvatar(hostData.avatar);
        }
      });

      await update(roomRef, {
        guest: { name: myName, avatar: myAvatar, status: "JOINED" },
        status: "PLAYING",
      });
      onDisconnect(child(roomRef, "guest")).remove();

      const connection = createFirebaseConnection(inputRoomId, "guest");
      setConn(connection);
      setIsHost(false);
      setRoomId(inputRoomId);

      setupGameListeners(connection);
      setIsConnecting(false);
      startMultiplayerMatch();
    } catch (error) {
      console.error(error);
      setIsConnecting(false);
      alert("Lỗi kết nối Server! Kiểm tra lại mạng.");
    }
  };

  const handleStartSolo = (name?: string) => {
    if (name) {
        setMyName(name);
        localStorage.setItem("mango-player-name", name);
    }
    
    setIsMultiplayer(false);
    setIsHost(true);
    setGameSessionId(Date.now());
    setGameState(GameState.PLAYING);
    if (conn) conn.close();
  };

  const handleGameOver = (
    score: number,
    itemsUsedStats: Record<string, number>,
    finalOpponentScore?: number,
    opponentItemsStats?: Record<string, number>,
    duration?: number,
    startTime?: number
  ) => {
    setFinalScore(score);
    setMatchDuration(duration || 0);
    
    const totalItems = Object.values(itemsUsedStats || {}).reduce((sum, count) => sum + count, 0);
    setMatchItemsCount(totalItems);
    if (isMultiplayer && finalOpponentScore !== undefined)
      setOpponentScore(finalOpponentScore);

    if (!isMultiplayer) {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("mango-sum10-highscore", score.toString());
      }

      const logEntry = {
        name: myName,
        timestamp: Date.now(),
        action: 'SOLO_PRACTICE',
        score: score 
      };
      push(ref(db, 'practice_logs'), logEntry);
    }

    setIsMeReady(false);
    setGameState(GameState.GAME_OVER);
    
    const newRecord: MatchRecord = {
        id: Date.now().toString(),
        timestamp: startTime || Date.now(),
        mode: isMultiplayer ? "MULTIPLAYER" : "SOLO",
        myName: myName,
        myScore: score,
        itemsUsed: itemsUsedStats as any,
        opponentItemsUsed: opponentItemsStats,
        duration: duration || 120
    };
    const currentHistory = localStorage.getItem("mango-match-history");
    let history: MatchRecord[] = currentHistory ? JSON.parse(currentHistory) : [];
    history.push(newRecord);
    if (history.length > 20) history = history.slice(history.length - 20);
    localStorage.setItem("mango-match-history", JSON.stringify(history));
  };

  const handleRestart = () => {
    console.log("[DEBUG] User clicked Restart.");

    if (isMultiplayer && roomId) {
      setIsMeReady(true);
      const myRoleKey = isHost ? "host" : "guest";
      update(ref(db, `rooms/${roomId}/restart`), {
        [myRoleKey]: true,
      });
    } else {
      setGameSessionId(Date.now());
      setGameState(GameState.PLAYING);
    }
  };

  const handleGoHome = () => {
    if (roomId) {
      const roomRef = ref(db, `rooms/${roomId}`);
      if (isHost) remove(roomRef);
      else remove(child(roomRef, "guest"));
    }
    setGameState(GameState.MENU);
    setIsMeReady(false);
    setOpponentScore(0);
    setFinalScore(0);
    setIsConnecting(false);
    setRoomId(null);
    if (conn) conn.close();
  };

  const handleUpdateName = (name: string) => {
    setMyName(name);
    localStorage.setItem("mango-player-name", name);
  };
  const handleUpdateAvatar = (avatar: string) => {
    setMyAvatar(avatar);
    localStorage.setItem("mango-player-avatar", avatar);
  };

  const handleSetTheme = (newTheme: ThemeType) => {
     setAppTheme(newTheme);
     localStorage.setItem('mango-theme', newTheme);
  };

  return (
    <div className="h-[100dvh] w-full relative overflow-hidden bg-cyan-50">
      {gameState === GameState.MENU && (
        <StartScreen
          onStart={handleStartSolo}
          onMultiplayer={handleOpenLobby}
          onOpenHistory={() => setGameState(GameState.HISTORY)}
          highScore={highScore}
          currentTheme={appTheme}
          onSetTheme={handleSetTheme}
        />
      )}
      {gameState === GameState.HISTORY && (
        <HistoryScreen 
          onBack={() => setGameState(GameState.MENU)} 
          playerName={myName}
        />
      )}
      {gameState === GameState.LOBBY && (
        <LobbyScreen
          displayId={roomId}
          onJoin={handleJoinGame}
          onBack={handleGoHome}
          isConnecting={isConnecting}
          myName={myName}
          setMyName={handleUpdateName}
          myAvatar={myAvatar}
          setMyAvatar={handleUpdateAvatar}
        />
      )}

      {gameState === GameState.PLAYING && (
        <Game
          key={
            isMultiplayer
              ? `multi-${roomId}-${gameSessionId}`
              : `solo-${gameSessionId}`
          }
          onGameOver={handleGameOver}
          isMultiplayer={isMultiplayer}
          isHost={isHost}
          connection={conn as any}
          myName={myName}
          opponentName={opponentName}
          myAvatar={myAvatar}
          opponentAvatar={opponentAvatar}
          theme={appTheme}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <>
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-repeat bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
          <GameOverScreen
            score={finalScore}
            opponentScore={opponentScore}
            highScore={highScore}
            onRestart={handleRestart}
            onHome={handleGoHome}
            isMultiplayer={isMultiplayer}
            isWaitingForOpponent={isMultiplayer && isMeReady}
            myName={myName}
            opponentName={opponentName}
            myAvatar={myAvatar}
            opponentAvatar={opponentAvatar}
            duration={matchDuration}
            itemsUsedCount={matchItemsCount}
          />
        </>
      )}
    </div>
  );
}