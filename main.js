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

if (deckSource && deckCount && discardCount && discardSlot && playerHandSlots.length > 0 && cardSlots.length > 0) {
  let remainingCards = Number(deckCount.textContent) || 30;
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

  const createGameCard = () => {
    const gameCard = document.createElement("div");
    gameCard.className = "game-card";
    gameCard.textContent = "表";
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

      placeCardInSlot(slot, createGameCard());
      remainingCards -= 1;
      syncDeckCount();
      cleanupDragState();
    });
  });

  syncDiscardCount();
}
