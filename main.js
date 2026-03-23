const SPREADSHEET_ID = "1ClbDh7Ih8Z5038Wxp-TYhDeXuEDdeDFk9MiJ3aU8CiI";

// APIキー管理
const API_KEY_STORAGE_KEY = 'card_game_api_key';
let currentAPIKey = localStorage.getItem(API_KEY_STORAGE_KEY) || '';

// APIキーの設定・取得関数
function setAPIKey(key) {
  currentAPIKey = key;
  if (key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
  updateAPIKeyUI();
}

function getAPIKey() {
  return currentAPIKey;
}

function updateAPIKeyUI() {
  const trigger = document.querySelector('.api-key-trigger');
  const statusElement = document.getElementById('api-key-status');
  
  if (currentAPIKey) {
    trigger?.classList.add('has-key');
    if (statusElement) {
      statusElement.textContent = 'API key is set';
      statusElement.style.color = 'var(--accent)';
    }
  } else {
    trigger?.classList.remove('has-key');
    if (statusElement) {
      statusElement.textContent = 'No API key set';
      statusElement.style.color = 'var(--muted)';
    }
  }
}

// スプレッドシートから全カードデータを取得する
async function getCardDataFromSpreadsheet() {
  const apiKey = getAPIKey();
  if (!apiKey) {
    console.warn("API key not set");
    return [];
  }

  try {
    const range = "A:I"; // A列からI列までを取得
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn("スプレッドシートの読み込みに失敗しました:", response.statusText);
      return [];
    }
    
    const data = await response.json();
    if (!data.values || data.values.length <= 1) {
      return [];
    }
    
    // 2行目以降のデータを処理
    const cardData = [];
    for (let i = 1; i < data.values.length; i++) {
      const row = data.values[i];
      if (row && row[0] && row[0].trim() !== "") {
        cardData.push({
          type: row[0] || '', // A列：カード種別
          suit: row[1] || '', // B列：スート
          song: row[2] || '', // C列：歌
          dance: row[3] || '', // D列：ダンス
          expression: row[4] || '', // E列：表現
          heart: row[5] || '', // F列：ハート
          text: row[8] || '' // I列：テキスト
        });
      }
    }
    
    return cardData;
  } catch (error) {
    console.error("スプレッドシートの読み込みエラー:", error);
    return [];
  }
}

const settingsTrigger = document.querySelector(".settings-trigger");
const settingsModal = document.querySelector("#settings-modal");
const modalClose = document.querySelector(".modal-close");
const deckSource = document.querySelector("[data-draw-deck='shared']");
const deckCount = document.querySelector("[data-deck-count]");
const discardCount = document.querySelector("[data-discard-count]");
const discardSlot = document.querySelector(".discard-slot");
const playerHandSlots = Array.from(document.querySelectorAll("[data-hand-slot]"));
const cardSlots = Array.from(document.querySelectorAll(".hand-slot, .card-slot, .discard-slot"));

if (settingsTrigger && settingsModal && modalClose) {
  const openModal = () => {
    settingsModal.hidden = false;
    settingsTrigger.setAttribute("aria-expanded", "true");
    modalClose.focus();
  };

  const closeModal = () => {
    settingsModal.hidden = true;
    settingsTrigger.setAttribute("aria-expanded", "false");
    settingsTrigger.focus();
  };

  settingsTrigger.addEventListener("click", openModal);
  modalClose.addEventListener("click", closeModal);

  settingsModal.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !settingsModal.hidden) {
      closeModal();
    }
  });
}

// APIキー設定モーダルの制御
const apiKeyTrigger = document.querySelector(".api-key-trigger");
const apiKeyModal = document.querySelector("#api-key-modal");
const apiModalClose = document.querySelector(".api-modal-close");
const apiKeyInput = document.getElementById("api-key-input");
const apiKeySaveBtn = document.getElementById("api-key-save");
const apiKeyClearBtn = document.getElementById("api-key-clear");

if (apiKeyTrigger && apiKeyModal && apiModalClose && apiKeyInput && apiKeySaveBtn && apiKeyClearBtn) {
  const openApiModal = () => {
    apiKeyModal.hidden = false;
    apiKeyTrigger.setAttribute("aria-expanded", "true");
    // 現在のAPIキーをマスクして表示
    if (currentAPIKey) {
      apiKeyInput.value = '•'.repeat(Math.min(currentAPIKey.length, 30));
    }
    apiKeyInput.focus();
  };

  const closeApiModal = () => {
    apiKeyModal.hidden = true;
    apiKeyTrigger.setAttribute("aria-expanded", "false");
    apiKeyInput.value = '';
    apiKeyTrigger.focus();
  };

  const saveApiKey = () => {
    const key = apiKeyInput.value.trim();
    // マスク文字列でない場合のみ保存
    if (key && !key.startsWith('•')) {
      setAPIKey(key);
      console.log("APIキーが保存されました");
      closeApiModal();
      // デッキを再初期化
      initializeDeck();
    }
  };

  const clearApiKey = () => {
    if (confirm("APIキーを削除しますか？")) {
      setAPIKey('');
      console.log("APIキーが削除されました");
      closeApiModal();
    }
  };

  apiKeyTrigger.addEventListener("click", openApiModal);
  apiModalClose.addEventListener("click", closeApiModal);
  apiKeySaveBtn.addEventListener("click", saveApiKey);
  apiKeyClearBtn.addEventListener("click", clearApiKey);

  // Enterキーでの保存
  apiKeyInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveApiKey();
    }
  });

  apiKeyModal.addEventListener("click", (event) => {
    if (event.target === apiKeyModal) {
      closeApiModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !apiKeyModal.hidden) {
      closeApiModal();
    }
  });

  // マスクされたフィールドがクリックされたらクリア
  apiKeyInput.addEventListener("focus", () => {
    if (apiKeyInput.value.startsWith('•')) {
      apiKeyInput.value = '';
      apiKeyInput.type = 'text';
    }
  });

  // フォーカスが外れたらパスワード形式に戻す
  apiKeyInput.addEventListener("blur", () => {
    apiKeyInput.type = 'password';
  });
}

if (deckSource && deckCount && discardCount && discardSlot && playerHandSlots.length > 0 && cardSlots.length > 0) {
  let remainingCards = Number(deckCount.textContent) || 50;
  let dragGhost = null;
  let draggedCard = null;
  let draggedFromSlot = null;

  const syncDeckCount = () => {
    deckCount.textContent = String(remainingCards);
  };

  const syncDiscardCount = () => {
    discardCount.textContent = String(discardSlot.querySelectorAll(".game-card").length);
  };

  const getEmptyHandSlot = () => playerHandSlots.find((slot) => !slot.querySelector(".game-card"));

  const setSlotState = (slot) => {
    slot.classList.toggle("has-card", Boolean(slot.querySelector(".game-card")));
  };

  // デッキの構成を事前に作成
  let cardDataList = []; // スプレッドシートから取得したカードデータ
  let cardIndex = 0;

  // スプレッドシートからデッキサイズを初期化
  const initializeDeck = async () => {
    cardDataList = await getCardDataFromSpreadsheet();
    remainingCards = cardDataList.length;
    deckCount.textContent = String(cardDataList.length);
    
    // カードデータをシャッフル（Fisher-Yates アルゴリズム）
    for (let i = cardDataList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardDataList[i], cardDataList[j]] = [cardDataList[j], cardDataList[i]];
    }
    
    cardIndex = 0;
    console.log(`デッキを初期化しました: ${cardDataList.length}枚`);
  };

  // 初期化を実行
  initializeDeck();

  const createGameCard = () => {
    const gameCard = document.createElement("div");
    gameCard.className = "game-card";
    
    // スプレッドシートから取得したデータを使用
    if (cardIndex >= cardDataList.length) {
      console.warn("カードデータが不足しています");
      return null;
    }
    
    const cardData = cardDataList[cardIndex];
    cardIndex++;
    
    // カード種別の判定（日本語での比較）
    const isIdol = cardData.type === 'アイドル' || cardData.type === 'idol';
    const isItem = cardData.type === 'アイテム' || cardData.type === 'item';
    const isEffect = cardData.type === '効果' || cardData.type === 'effect';
    
    // カード種別ヘッダー
    const header = document.createElement("div");
    header.className = "card-header";
    header.textContent = cardData.type || 'カード';
    
    // カードコンテンツ（テキスト部分）
    const content = document.createElement("div");
    content.className = "card-content";
    content.textContent = cardData.text || 'カードテキスト';
    
    gameCard.appendChild(header);
    gameCard.appendChild(content);
    
    // アイドルカードの場合のみ、ステータスとスーツを設定
    if (isIdol) {
      // カード下部のステータス
      const footer = document.createElement("div");
      footer.className = "card-footer";
      
      // ステータスアイコンと値（Material Symbolsを使用）
      const stats = [
        { icon: 'music_note', label: '歌', value: cardData.song || '' },
        { icon: 'directions_walk', label: 'ダンス', value: cardData.dance || '' }, 
        { icon: 'flash_on', label: '表現', value: cardData.expression || '' },
        { icon: 'favorite', label: 'ハート', value: cardData.heart || '' }
      ];
      
      stats.forEach(stat => {
        const statDiv = document.createElement("div");
        statDiv.className = "card-stat";
        
        const iconSpan = document.createElement("span");
        iconSpan.className = "card-stat-icon material-symbols-outlined";
        iconSpan.textContent = stat.icon;
        statDiv.appendChild(iconSpan);
        
        // 数値が存在する場合は表示
        if (stat.value && stat.value.toString().trim() !== '') {
          const valueSpan = document.createElement("span");
          valueSpan.className = "card-stat-value";
          valueSpan.textContent = stat.value;
          statDiv.appendChild(valueSpan);
        }
        
        footer.appendChild(statDiv);
      });
      
      gameCard.appendChild(footer);
      
      // スーツと背景色を設定（スプレッドシートから取得）
      let suit = 'hearts'; // デフォルト値
      if (cardData.suit) {
        const suitMap = {
          'ハート': 'hearts',
          'heart': 'hearts',
          'hearts': 'hearts',
          'ダイヤ': 'diamonds',
          'diamond': 'diamonds',
          'diamonds': 'diamonds',
          'スペード': 'spades',
          'spade': 'spades',
          'spades': 'spades',
          'クラブ': 'clubs',
          'club': 'clubs',
          'clubs': 'clubs'
        };
        suit = suitMap[cardData.suit.toLowerCase()] || 'hearts';
      }
      
      gameCard.classList.add('idol', suit);
      
      // スーツアイコン
      const suitIcon = document.createElement("div");
      suitIcon.className = "card-suit-icon";
      suitIcon.textContent = suit === 'hearts' ? '♥️' : 
                           suit === 'diamonds' ? '♦️' : 
                           suit === 'spades' ? '♠️' : '♣️';
      gameCard.appendChild(suitIcon);
    }
    gameCard.draggable = true;
    
    return gameCard;
  };

  const clearDropStates = () => {
    cardSlots.forEach((slot) => slot.classList.remove("is-over"));
  };

  const cleanupGhost = () => {
    if (dragGhost) {
      dragGhost.remove();
      dragGhost = null;
    }
  };

  const cleanupDragState = () => {
    clearDropStates();
    cleanupGhost();
    if (draggedCard) {
      draggedCard.classList.remove("is-dragging");
    }
    draggedCard = null;
    draggedFromSlot = null;
  };

  const placeCardInSlot = (slot, card) => {
    slot.appendChild(card);
    setSlotState(slot);
    if (slot === discardSlot) {
      syncDiscardCount();
    }
  };

  const canAcceptCard = (slot) => {
    if (slot.classList.contains("discard-slot")) {
      return true;
    }

    return !slot.querySelector(".game-card");
  };

  deckSource.addEventListener("dragstart", (event) => {
    if (!getEmptyHandSlot() || remainingCards <= 0) {
      event.preventDefault();
      return;
    }

    dragGhost = deckSource.cloneNode(true);
    dragGhost.classList.add("drag-ghost");
    document.body.appendChild(dragGhost);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("text/plain", "shared-deck-card");
      event.dataTransfer.setDragImage(dragGhost, dragGhost.offsetWidth / 2, dragGhost.offsetHeight / 2);
    }
  });

  deckSource.addEventListener("dragend", () => {
    cleanupDragState();
  });

  document.addEventListener("dragstart", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains("game-card")) {
      return;
    }

    draggedCard = target;
    draggedFromSlot = target.parentElement instanceof HTMLElement ? target.parentElement : null;
    draggedCard.classList.add("is-dragging");

    dragGhost = target.cloneNode(true);
    dragGhost.classList.remove("is-dragging");
    dragGhost.classList.add("drag-ghost");
    document.body.appendChild(dragGhost);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", "placed-card");
      event.dataTransfer.setDragImage(dragGhost, dragGhost.offsetWidth / 2, dragGhost.offsetHeight / 2);
    }
  });

  document.addEventListener("dragend", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.classList.contains("game-card")) {
      cleanupDragState();
    }
  });

  cardSlots.forEach((slot) => {
    slot.addEventListener("dragover", (event) => {
      const draggingFromDeck = event.dataTransfer?.types.includes("text/plain") && !draggedCard;
      const draggingCard = Boolean(draggedCard);

      if (!draggingFromDeck && !draggingCard) {
        return;
      }

      if (draggingFromDeck && !canAcceptCard(slot)) {
        return;
      }

      if (draggingFromDeck && remainingCards <= 0) {
        return;
      }

      if (draggingCard && slot === draggedFromSlot) {
        event.preventDefault();
        return;
      }

      if (draggingCard && !canAcceptCard(slot)) {
        return;
      }

      event.preventDefault();
      clearDropStates();
      slot.classList.add("is-over");
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = draggingCard ? "move" : "copy";
      }
    });

    slot.addEventListener("dragleave", (event) => {
      if (!slot.contains(event.relatedTarget)) {
        slot.classList.remove("is-over");
      }
    });

    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("is-over");

      if (draggedCard) {
        if (slot === draggedFromSlot || !canAcceptCard(slot)) {
          cleanupDragState();
          return;
        }

        placeCardInSlot(slot, draggedCard);
        if (draggedFromSlot) {
          setSlotState(draggedFromSlot);
          if (draggedFromSlot === discardSlot) {
            syncDiscardCount();
          }
        }
        cleanupDragState();
        return;
      }

      if (remainingCards <= 0 || !canAcceptCard(slot)) {
        cleanupDragState();
        return;
      }

      const newCard = createGameCard();
      if (!newCard) {
        console.warn("新しいカードを作成できませんでした");
        cleanupDragState();
        return;
      }

      placeCardInSlot(slot, newCard);
      remainingCards -= 1;
      syncDeckCount();
      cleanupDragState();
    });
  });

  syncDiscardCount();
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
  updateAPIKeyUI();
});
