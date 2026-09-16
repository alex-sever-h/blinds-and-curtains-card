class BlindsAndCurtainsCard extends HTMLElement {
  normalizeStyle(style) {
    const s = (style || "roller").toLowerCase();

    if (s === "door" || s === "single_door") return "single_door";
    if (s === "split_window" || s === "awning_window") return "split_window";
    if (s === "window_door") return "window_door";
    if (s === "double_window") return "double_window";
    if (s === "triple_window") return "triple_window";
    if (s === "sliding_left") return "sliding_left";
    if (s === "sliding_right") return "sliding_right";

    return "roller";
  }

  getRoomVisualHtml(style) {
    switch (style) {
      case "single_door":
        return `
          <div class="sc-room-visual sc-room-single_door">
            <div class="sc-door-panel"></div>
            <div class="sc-door-handle"></div>
          </div>
        `;

      case "split_window":
        return `
          <div class="sc-room-visual sc-room-split_window">
            <div class="sc-split-top-panel"></div>
            <div class="sc-split-bottom-panel"></div>
            <div class="sc-split-divider"></div>
            <div class="sc-split-handle"></div>
          </div>
        `;

      case "window_door":
        return `
          <div class="sc-room-visual sc-room-window_door">
            <div class="sc-wd-window"></div>
            <div class="sc-wd-door"></div>
            <div class="sc-wd-door-handle"></div>
          </div>
        `;

      case "double_window":
        return `
          <div class="sc-room-visual sc-room-double_window">
            <div class="sc-double-pane sc-double-pane-1"></div>
            <div class="sc-double-pane sc-double-pane-2"></div>
            <div class="sc-double-mullion"></div>
          </div>
        `;

      case "triple_window":
        return `
          <div class="sc-room-visual sc-room-triple_window">
            <div class="sc-triple-pane sc-triple-pane-1"></div>
            <div class="sc-triple-pane sc-triple-pane-2"></div>
            <div class="sc-triple-pane sc-triple-pane-3"></div>
            <div class="sc-triple-mullion sc-triple-mullion-1"></div>
            <div class="sc-triple-mullion sc-triple-mullion-2"></div>
          </div>
        `;

      case "sliding_left":
        return `
          <div class="sc-room-visual sc-room-sliding_left">
            <div class="sc-slider-panel sc-slider-panel-left"></div>
            <div class="sc-slider-panel sc-slider-panel-right"></div>
            <div class="sc-slider-divider"></div>
            <div class="sc-slider-handle sc-slider-handle-right"></div>
          </div>
        `;

      case "sliding_right":
        return `
          <div class="sc-room-visual sc-room-sliding_right">
            <div class="sc-slider-panel sc-slider-panel-left"></div>
            <div class="sc-slider-panel sc-slider-panel-right"></div>
            <div class="sc-slider-divider"></div>
            <div class="sc-slider-handle sc-slider-handle-left"></div>
          </div>
        `;

      default:
        return `<div class="sc-room-visual sc-room-roller"></div>`;
    }
  }

  getPointerPageY(event) {
    if (event.pageY !== undefined) return event.pageY;
    if (event.touches && event.touches[0]) return event.touches[0].pageY;
    if (event.changedTouches && event.changedTouches[0]) return event.changedTouches[0].pageY;
    return 0;
  }

  getPointerPageX(event) {
    if (event.pageX !== undefined) return event.pageX;
    if (event.touches && event.touches[0]) return event.touches[0].pageX;
    if (event.changedTouches && event.changedTouches[0]) return event.changedTouches[0].pageX;
    return 0;
  }

  getPictureLeft(picture) {
    const pictureBox = picture.getBoundingClientRect();
    const body = document.body;
    const docEl = document.documentElement;
    const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
    const clientLeft = docEl.clientLeft || body.clientLeft || 0;
    return pictureBox.left + scrollLeft - clientLeft;
  }

  getMotion(picture) {
    const m = (picture.dataset.motion || "rtl").toLowerCase();
    return m === "ltr" || m === "center" || m === "down" ? m : "rtl";
  }

  getPictureTop(picture) {
    const pictureBox = picture.getBoundingClientRect();
    const body = document.body;
    const docEl = document.documentElement;
    const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    const clientTop = docEl.clientTop || body.clientTop || 0;
    return pictureBox.top + scrollTop - clientTop;
  }

  getTrackMetrics(picture) {
    const cs = getComputedStyle(picture);
    const trackTop = parseFloat(cs.getPropertyValue("--track-top")) || 20;
    const trackLeft = parseFloat(cs.getPropertyValue("--track-left")) || 10;
    const trackRight = parseFloat(cs.getPropertyValue("--track-right")) || 10;
    const trackBottom = parseFloat(cs.getPropertyValue("--track-bottom")) || 4;
    const pickerWidth = parseFloat(cs.getPropertyValue("--picker-width")) || 10;
    const pickerHeight = parseFloat(cs.getPropertyValue("--picker-height")) || 8;
    const overlap = 1;
    const vertical = (picture.dataset.motion || "rtl").toLowerCase() === "down";
    const usable = vertical
      ? picture.clientHeight - trackTop - trackBottom - pickerHeight
      : picture.clientWidth - trackLeft - trackRight - overlap * 2;

    return {
      // `pos` is travel distance in px from the parked edge(s).
      min: 0,
      max: Math.max(0, usable),
      top: trackTop,
      bottom: trackBottom,
      left: trackLeft,
      right: trackRight,
      overlap: overlap,
      pickerWidth: pickerWidth,
      pickerHeight: pickerHeight,
      vertical: vertical,
      sheetHeight: Math.max(0, picture.clientHeight - trackTop - trackBottom),
    };
  }

  projectedPositionFromTrack(position, invertPercentage, picture) {
    const metrics = this.getTrackMetrics(picture);
    const clamped = Math.max(metrics.min, Math.min(metrics.max, position));
    const percentagePosition = ((clamped - metrics.min) * 100) / (metrics.max - metrics.min);
    return invertPercentage ? Math.round(percentagePosition) : Math.round(100 - percentagePosition);
  }

  updateBlindPosition(hass, entityId, position) {
    hass.callService("cover", "set_cover_position", {
      entity_id: entityId,
      position: Math.round(position),
    });
  }

  setPickerPosition(position, picker, slide, picture, pull, pullStem, dragIndicator) {
    const metrics = this.getTrackMetrics(picture);
    const motion = this.getMotion(picture);
    const slide2 = picture.querySelector(".sc-blind-selector-slide2");
    const picker2 = picture.querySelector(".sc-blind-selector-picker2");

    if (picker2) {
      picker2.style.display = motion === "center" ? "block" : "none";
      picker2.style.top = metrics.top + "px";
      picker2.style.height = metrics.sheetHeight + "px";
      picker2.style.width = metrics.pickerWidth + "px";
    }

    let pos = position;
    if (pos < metrics.min) pos = metrics.min;
    if (pos > metrics.max) pos = metrics.max;

    const inset = metrics.overlap;
    const leftBase = metrics.left + inset;
    const rightBase = metrics.right + inset;

    slide.style.top = metrics.top + "px";
    slide.style.height = metrics.sheetHeight + "px";
    picker.style.top = metrics.top + "px";
    picker.style.height = metrics.sheetHeight + "px";
    picker.style.width = metrics.pickerWidth + "px";

    if (motion === "down") {
      if (slide2) slide2.style.display = "none";
      if (picker2) picker2.style.display = "none";

      // Exterior roller: the sheet hangs in front of the whole window,
      // covering the frame edge to edge, not inset between the panes.
      slide.style.left = "0px";
      slide.style.right = "auto";
      slide.style.width = "100%";
      slide.style.top = "0px";
      slide.style.height = metrics.top + pos + "px";

      picker.style.left = "0px";
      picker.style.right = "auto";
      picker.style.width = "100%";
      picker.style.height = metrics.pickerHeight + "px";
      picker.style.top = metrics.top + pos + "px";

      if (dragIndicator) {
        dragIndicator.style.left = Math.round(picture.clientWidth / 2) + "px";
        dragIndicator.style.top = Math.max(2, metrics.top + pos - 30) + "px";
      }

      if (pull) pull.style.display = "none";
      if (pullStem) pullStem.style.display = "none";
      return;
    }

    if (motion === "center") {
      const half = pos / 2;

      slide.style.left = leftBase + "px";
      slide.style.right = "auto";
      slide.style.width = half + "px";

      if (slide2) {
        slide2.style.display = "block";
        slide2.style.top = metrics.top + "px";
        slide2.style.height = metrics.sheetHeight + "px";
        slide2.style.right = rightBase + "px";
        slide2.style.left = "auto";
        slide2.style.width = half + "px";
      }

      picker.style.left = leftBase + half + "px";
      picker.style.right = "auto";

      if (picker2) {
        picker2.style.right = rightBase + half + "px";
        picker2.style.left = "auto";
      }
    } else if (motion === "ltr") {
      if (slide2) slide2.style.display = "none";
      slide.style.left = leftBase + "px";
      slide.style.right = "auto";
      slide.style.width = pos + "px";
      picker.style.left = leftBase + pos + "px";
      picker.style.right = "auto";
    } else {
      if (slide2) slide2.style.display = "none";
      slide.style.right = rightBase + "px";
      slide.style.left = "auto";
      slide.style.width = pos + "px";
      picker.style.right = rightBase + pos + "px";
      picker.style.left = "auto";
    }

    if (pull) pull.style.display = "none";
    if (pullStem) pullStem.style.display = "none";

    if (dragIndicator) {
      let indicatorX;
      if (motion === "center") indicatorX = leftBase + pos / 2;
      else if (motion === "ltr") indicatorX = leftBase + pos;
      else indicatorX = picture.clientWidth - rightBase - pos;
      dragIndicator.style.left = Math.round(indicatorX) + "px";
      dragIndicator.style.top = "-6px";
    }
  }

  setPickerPositionPercentage(position, picker, slide, picture, pull, pullStem, dragIndicator) {
    const metrics = this.getTrackMetrics(picture);
    const realPosition = ((metrics.max - metrics.min) * position) / 100 + metrics.min;
    this.setPickerPosition(realPosition, picker, slide, picture, pull, pullStem, dragIndicator);
  }

  set hass(hass) {
    const _this = this;
    const entities = this.config.entities;

    if (!this.card) {
      const card = document.createElement("ha-card");

      if (this.config.title) {
        card.header = this.config.title;
      }

      this.card = card;
      this.appendChild(card);

      const allBlinds = document.createElement("div");
      allBlinds.className = "sc-blinds";

      entities.forEach(function (entity) {
        const entityId = typeof entity === "string" ? entity : entity.entity;

        let buttonsPosition = "left";
        if (entity && entity.buttons_position) {
          buttonsPosition = entity.buttons_position.toLowerCase();
        }

        let titlePosition = "top";
        if (entity && entity.title_position) {
          titlePosition = entity.title_position.toLowerCase();
        }

        let invertPercentage = false;
        if (entity && entity.invert_percentage) {
          invertPercentage = entity.invert_percentage;
        }

        let invertCommands = false;
        if (entity && entity.invert_commands) {
          invertCommands = entity.invert_commands;
        }

        let blindColor = "#4a4a4a";
        if (entity && entity.blind_color) {
          blindColor = entity.blind_color;
        }

        const blindStyle = _this.normalizeStyle(entity && entity.style ? entity.style : "roller");

        const motion = _this.getMotion({ dataset: { motion: entity && entity.motion ? entity.motion : "rtl" } });

        let showPull = false;
        if (entity && entity.show_pull !== undefined) {
          showPull = entity.show_pull;
        }

        let pullColor = "#d8d8d8";
        if (entity && entity.pull_color) {
          pullColor = entity.pull_color;
        }

        const blind = document.createElement("div");
        blind.className = "sc-blind";
        blind.dataset.blind = entityId;

        blind.innerHTML = `
          <div class="sc-blind-top" ${titlePosition === "bottom" ? 'style="display:none;"' : ""}>
            <div class="sc-blind-label"></div>
            <div class="sc-blind-position"></div>
          </div>

          <div class="sc-blind-middle" style="flex-direction:${buttonsPosition === "right" ? "row-reverse" : "row"};">
            <div class="sc-blind-buttons">
              <ha-icon-button class="sc-blind-button" data-command="up"><ha-icon icon="${motion === "down" ? "mdi:arrow-up" : "mdi:arrow-expand-horizontal"}"></ha-icon></ha-icon-button><br>
              <ha-icon-button class="sc-blind-button" data-command="stop"><ha-icon icon="mdi:stop"></ha-icon></ha-icon-button><br>
              <ha-icon-button class="sc-blind-button" data-command="down"><ha-icon icon="${motion === "down" ? "mdi:arrow-down" : "mdi:arrow-collapse-horizontal"}"></ha-icon></ha-icon-button>
            </div>

            <div class="sc-blind-selector">
              <div class="sc-blind-selector-picture sc-style-${blindStyle}" data-motion="${motion}">
                ${_this.getRoomVisualHtml(blindStyle)}

                <div class="sc-blind-sheet-wrap">
                  <div class="sc-blind-roller"></div>
                  <div class="sc-blind-selector-slide"></div>
                  <div class="sc-blind-selector-slide2"></div>
                  <div class="sc-blind-selector-picker"></div>
                  <div class="sc-blind-selector-picker2"></div>
                  ${
                    showPull
                      ? '<div class="sc-blind-pull-stem" style="left:50%; top:20px; height:12px;"></div><div class="sc-blind-pull" style="left:50%; top:32px;"></div>'
                      : ""
                  }
                  <div class="sc-drag-indicator"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="sc-blind-bottom" ${titlePosition !== "bottom" ? 'style="display:none;"' : ""}>
            <div class="sc-blind-label"></div>
            <div class="sc-blind-position"></div>
          </div>
        `;

        const picture = blind.querySelector(".sc-blind-selector-picture");
        const slide = blind.querySelector(".sc-blind-selector-slide");
        const picker = blind.querySelector(".sc-blind-selector-picker");
        const picker2 = blind.querySelector(".sc-blind-selector-picker2");
        const pull = blind.querySelector(".sc-blind-pull");
        const pullStem = blind.querySelector(".sc-blind-pull-stem");
        const roller = blind.querySelector(".sc-blind-roller");
        const dragIndicator = blind.querySelector(".sc-drag-indicator");

        const slide2 = blind.querySelector(".sc-blind-selector-slide2");
        slide.style.background = blindColor;
        if (slide2) slide2.style.background = blindColor;
        if (roller) roller.style.background = "rgba(214,214,214,0.98)";
        if (pull) pull.style.background = pullColor;
        if (pullStem) pullStem.style.background = pullColor;

        const applyTrackLayout = function () {
          _this.setPickerPosition(0, picker, slide, picture, pull, pullStem, dragIndicator);
        };

        applyTrackLayout();

        let dragOffsetX = 0;

        const showIndicator = function (text) {
          if (!dragIndicator) return;
          dragIndicator.textContent = text;
          dragIndicator.classList.add("show");
        };

        const hideIndicator = function () {
          if (!dragIndicator) return;
          dragIndicator.classList.remove("show");
        };

        const updatePreviewPosition = function (rawPosition) {
          const metrics = _this.getTrackMetrics(picture);

          let pos = rawPosition;
          if (pos < metrics.min) pos = metrics.min;
          if (pos > metrics.max) pos = metrics.max;

          const projected = _this.projectedPositionFromTrack(pos, invertPercentage, picture);

          showIndicator(projected + "%");
          _this.setPickerPosition(pos, picker, slide, picture, pull, pullStem, dragIndicator);
        };

        let dragFromRight = false;

        const posFromPageX = function (pageX) {
          const metrics = _this.getTrackMetrics(picture);
          const motion = _this.getMotion(picture);

          if (motion === "down") {
            return pageX - _this.getPictureTop(picture) - metrics.top - dragOffsetX;
          }

          const pictureLeft = _this.getPictureLeft(picture);
          const leftBase = pictureLeft + metrics.left + metrics.overlap;
          const rightBase = pictureLeft + picture.clientWidth - metrics.right - metrics.overlap;

          if (motion === "center") {
            return dragFromRight
              ? (rightBase - pageX - dragOffsetX) * 2
              : (pageX - leftBase - dragOffsetX) * 2;
          }
          if (motion === "ltr") return pageX - leftBase - dragOffsetX;
          return rightBase - pageX + dragOffsetX;
        };

        const mouseDown = function (event) {
          if (event.cancelable) event.preventDefault();
          _this.isUpdating = true;
          dragOffsetX = 0;
          dragFromRight = event.currentTarget === picker2;

          document.addEventListener("mousemove", mouseMove);
          document.addEventListener("touchmove", mouseMove, { passive: false });
          document.addEventListener("pointermove", mouseMove);

          document.addEventListener("mouseup", mouseUp);
          document.addEventListener("touchend", mouseUp);
          document.addEventListener("pointerup", mouseUp);
        };

        const readPointer = function (event) {
          return _this.getMotion(picture) === "down"
            ? _this.getPointerPageY(event)
            : _this.getPointerPageX(event);
        };

        const mouseMove = function (event) {
          updatePreviewPosition(posFromPageX(readPointer(event)));
        };

        const mouseUp = function (event) {
          const metrics = _this.getTrackMetrics(picture);

          let newPosition = posFromPageX(readPointer(event));

          if (newPosition < metrics.min) newPosition = metrics.min;
          if (newPosition > metrics.max) newPosition = metrics.max;

          const finalPosition = _this.projectedPositionFromTrack(newPosition, invertPercentage, picture);

          _this.isUpdating = false;
          hideIndicator();
          _this.updateBlindPosition(hass, entityId, finalPosition);

          document.removeEventListener("mousemove", mouseMove);
          document.removeEventListener("touchmove", mouseMove);
          document.removeEventListener("pointermove", mouseMove);

          document.removeEventListener("mouseup", mouseUp);
          document.removeEventListener("touchend", mouseUp);
          document.removeEventListener("pointerup", mouseUp);
        };

        if (pull) {
          pull.addEventListener("mousedown", mouseDown);
          pull.addEventListener("touchstart", mouseDown, { passive: false });
          pull.addEventListener("pointerdown", mouseDown);
        } else {
          [picker, picker2].forEach(function (handle) {
            if (!handle) return;
            handle.addEventListener("mousedown", mouseDown);
            handle.addEventListener("touchstart", mouseDown, { passive: false });
            handle.addEventListener("pointerdown", mouseDown);
          });
        }

        blind.querySelectorAll(".sc-blind-button").forEach(function (button) {
          button.onclick = function () {
            const command = this.dataset.command;
            let service = "";

            switch (command) {
              case "up":
                service = !invertCommands ? "open_cover" : "close_cover";
                break;
              case "down":
                service = !invertCommands ? "close_cover" : "open_cover";
                break;
              case "stop":
                service = "stop_cover";
                break;
            }

            hass.callService("cover", service, {
              entity_id: entityId,
            });
          };
        });

        allBlinds.appendChild(blind);
      });

      const style = document.createElement("style");
      style.textContent = `
        .sc-blinds { padding: 16px; }
        .sc-blind { margin-top: 1rem; overflow: visible; }
        .sc-blind:first-child { margin-top: 0; }

        .sc-blind-middle {
          display: flex;
          width: 100%;
          margin: auto;
          align-items: center;
          gap: 14px;
        }

        .sc-blind-buttons {
          flex: 0;
          text-align: center;
          margin-top: 0.2rem;
        }

        .sc-blind-selector {
          flex: 1;
        }

        .sc-blind-selector-picture {
          --track-top: 20px;
          --track-left: 10px;
          --track-right: 10px;
          --track-bottom: 4px;
          --picker-height: 8px;
          --pull-stem-length: 12px;
          --pull-dot-size: 12px;
          position: relative;
          margin: auto;
          background: transparent;
          box-sizing: border-box;
          overflow: visible;
        }

        .sc-room-visual {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .sc-blind-sheet-wrap {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
        }

        .sc-blind-roller {
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          height: 12px;
          border-radius: 7px;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.10);
          z-index: 4;
        }

        .sc-blind-selector-slide {
          position: absolute;
          z-index: 4;
          height: 0;
          opacity: 0.98;
          transition: none;
          box-shadow:
            inset 0 -8px 14px rgba(0,0,0,0.18),
            0 0 0 1px rgba(255,255,255,0.08);
        }

        .sc-blind-selector-picker {
          position: absolute;
          z-index: 5;
          cursor: ns-resize;
          background: transparent;
          pointer-events: none;
        }

        .sc-blind-pull-stem {
          position: absolute;
          left: 50%;
          top: 20px;
          width: 2px;
          height: 12px;
          transform: translateX(-50%);
          z-index: 6;
          pointer-events: none;
          opacity: 1;
        }

        .sc-blind-pull {
          position: absolute;
          left: 50%;
          top: 32px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          transform: translateX(-50%);
          z-index: 20;
          box-shadow: 0 0 0 2px rgba(0,0,0,0.22);
          cursor: ns-resize;
          pointer-events: auto;
        }

        .sc-drag-indicator {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          min-width: 42px;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 12px;
          line-height: 16px;
          text-align: center;
          background: rgba(30,30,30,0.9);
          color: #fff;
          z-index: 30;
          opacity: 0;
          pointer-events: none;
          transition: opacity 120ms ease;
        }

        .sc-drag-indicator.show {
          opacity: 1;
        }

        .sc-style-single_door,
        .sc-style-split_window,
        .sc-style-roller {
          width: 116px;
          height: 188px;
        }

        .sc-style-sliding_left,
        .sc-style-sliding_right {
          width: 208px;
          height: 188px;
        }

        /* ---- horizontal fork overrides ---- */
        .sc-blind-selector-picture {
          --picker-width: 10px;
        }

        .sc-blind-selector-slide2 {
          position: absolute;
          z-index: 4;
          width: 0;
          display: none;
          opacity: 0.98;
          transition: none;
          box-shadow:
            inset -8px 0 14px rgba(0,0,0,0.18),
            0 0 0 1px rgba(255,255,255,0.08);
        }

        .sc-blind-selector-slide {
          box-shadow:
            inset 8px 0 14px rgba(0,0,0,0.18),
            0 0 0 1px rgba(255,255,255,0.08) !important;
        }

        .sc-blind-selector-picker2 {
          position: absolute;
          z-index: 5;
          display: none;
        }

        .sc-style-triple_window[data-motion="down"] .sc-blind-selector-picker,
        [data-motion="down"] .sc-blind-selector-picker {
          cursor: ns-resize !important;
        }

        .sc-blind-selector-picker,
        .sc-blind-selector-picker2 {
          cursor: ew-resize !important;
          pointer-events: auto !important;
          background: rgba(255,255,255,0.28) !important;
          border-radius: 3px;
        }

        .sc-blind-roller {
          top: 8px !important;
          left: 6px !important;
          right: 6px !important;
          width: auto !important;
          height: 6px !important;
          transform: none !important;
        }

        .sc-drag-indicator {
          transform: translateX(-50%);
        }

        /* Fluid picture: fill the card, cap at the design width, never overflow.
           Upstream hard-codes a px width per style, which overflows narrow columns. */
        .sc-blind-selector-picture {
          width: 100% !important;
          margin-left: auto;
          margin-right: auto;
          overflow: hidden !important;
          box-sizing: border-box;
        }

        /* A flex child defaults to min-width:auto and refuses to shrink below
           its content, which pushes the picture past the card edge. */
        .sc-blind-selector { min-width: 0 !important; }
        .sc-blind-middle { min-width: 0; max-width: 100%; box-sizing: border-box; }
        .sc-blind, .sc-blinds { max-width: 100%; box-sizing: border-box; overflow-x: hidden; }

        .sc-style-single_door,
        .sc-style-split_window,
        .sc-style-roller { max-width: 116px; }

        .sc-style-sliding_left,
        .sc-style-sliding_right { max-width: 208px; }

        /* Upstream draws a decorative handle nub on each room visual —
           .sc-slider-handle sits at left:50%/top:48%, i.e. a dot dead centre.
           None of them mean anything here, so drop the lot. */
        .sc-slider-handle,
        .sc-split-handle,
        .sc-door-handle,
        .sc-wd-door-handle,
        .sc-blind-pull,
        .sc-blind-pull-stem {
          display: none !important;
        }

        /* wide short window on the left, tall door on the right, tops aligned */
        .sc-style-window_door {
          max-width: 300px;
          height: 188px;
        }

        .sc-room-window_door .sc-wd-window,
        .sc-room-window_door .sc-wd-door {
          position: absolute;
          top: 20px;
          border: 3px solid rgba(255,255,255,0.30);
          border-radius: 4px;
          background: rgba(255,255,255,0.05);
          box-sizing: border-box;
        }

        .sc-room-window_door .sc-wd-window {
          left: 8px;
          width: calc(60% - 12px);
          height: 86px;
        }

        .sc-room-window_door .sc-wd-door {
          right: 8px;
          width: calc(40% - 12px);
          bottom: 10px;
        }

        .sc-room-window_door .sc-wd-door-handle {
          position: absolute;
          right: calc(40% - 2px);
          top: 52%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.55);
        }

        /* two-pane window */
        .sc-style-double_window {
          max-width: 240px;
          height: 188px;
        }

        .sc-room-double_window .sc-double-pane {
          position: absolute;
          top: 20px;
          bottom: 10px;
          width: calc(50% - 12px);
          border: 3px solid rgba(255,255,255,0.30);
          border-radius: 4px;
          background: rgba(255,255,255,0.05);
          box-sizing: border-box;
        }

        .sc-room-double_window .sc-double-pane-1 { left: 8px; }
        .sc-room-double_window .sc-double-pane-2 { right: 8px; }

        .sc-room-double_window .sc-double-mullion {
          position: absolute;
          top: 20px;
          bottom: 10px;
          width: 3px;
          left: calc(50% - 1.5px);
          background: rgba(255,255,255,0.30);
        }

        /* wide three-pane window */
        .sc-style-triple_window {
          max-width: 320px;
          height: 188px;
        }

        .sc-room-triple_window .sc-triple-pane {
          position: absolute;
          top: 20px;
          bottom: 10px;
          width: calc(33.333% - 13px);
          border: 3px solid rgba(255,255,255,0.30);
          border-radius: 4px;
          background: rgba(255,255,255,0.05);
          box-sizing: border-box;
        }

        .sc-room-triple_window .sc-triple-pane-1 { left: 8px; }
        .sc-room-triple_window .sc-triple-pane-2 { left: 50%; transform: translateX(-50%); }
        .sc-room-triple_window .sc-triple-pane-3 { right: 8px; }

        .sc-room-triple_window .sc-triple-mullion {
          position: absolute;
          top: 20px;
          bottom: 10px;
          width: 3px;
          background: rgba(255,255,255,0.30);
        }

        .sc-room-triple_window .sc-triple-mullion-1 { left: calc(33.333% - 1px); }
        .sc-room-triple_window .sc-triple-mullion-2 { left: calc(66.666% - 2px); }
        /* ---- end overrides ---- */

        .sc-style-roller .sc-blind-roller,
        .sc-style-split_window .sc-blind-roller,
        .sc-style-sliding_left .sc-blind-roller,
        .sc-style-sliding_right .sc-blind-roller {
          width: calc(100% - 10px);
        }

        .sc-style-single_door .sc-blind-roller {
          width: calc(100% - 12px);
        }

        .sc-style-single_door .sc-blind-selector-slide {
          border-radius: 0;
        }

        .sc-style-roller .sc-blind-selector-slide,
        .sc-style-split_window .sc-blind-selector-slide,
        .sc-style-sliding_left .sc-blind-selector-slide,
        .sc-style-sliding_right .sc-blind-selector-slide,
        .sc-style-single_door .sc-blind-selector-slide {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          border-bottom-left-radius: 2px;
          border-bottom-right-radius: 2px;
        }

        .sc-room-single_door .sc-door-panel {
          position: absolute;
          top: 20px;
          bottom: 10px;
          left: 10px;
          right: 10px;
          border: 3px solid rgba(255,255,255,0.82);
          background: transparent;
        }

        .sc-room-single_door .sc-door-handle {
          position: absolute;
          right: 10px;
          top: 50%;
          width: 16px;
          height: 6px;
          margin-top: -3px;
          background: rgba(255,255,255,0.92);
          border-radius: 2px;
          z-index: 2;
        }

        .sc-room-split_window .sc-split-top-panel,
        .sc-room-split_window .sc-split-bottom-panel {
          position: absolute;
          left: 10px;
          right: 10px;
          border: 3px solid rgba(255,255,255,0.78);
          background: transparent;
        }

        .sc-room-split_window .sc-split-top-panel {
          top: 20px;
          height: 44%;
        }

        .sc-room-split_window .sc-split-bottom-panel {
          bottom: 10px;
          height: 38%;
        }

        .sc-room-split_window .sc-split-divider {
          position: absolute;
          left: 10px;
          right: 10px;
          top: 56%;
          height: 3px;
          margin-top: -1.5px;
          background: rgba(255,255,255,0.82);
        }

        .sc-room-split_window .sc-split-handle {
          position: absolute;
          left: 50%;
          top: 48%;
          width: 14px;
          height: 5px;
          margin-left: -7px;
          background: rgba(255,255,255,0.92);
          border-radius: 2px;
          z-index: 2;
        }

        .sc-room-sliding_left .sc-slider-panel,
        .sc-room-sliding_right .sc-slider-panel {
          position: absolute;
          top: 20px;
          bottom: 10px;
          width: calc(50% - 16px);
          border: 3px solid rgba(255,255,255,0.78);
          background: transparent;
        }

        .sc-room-sliding_left .sc-slider-panel-left,
        .sc-room-sliding_right .sc-slider-panel-left {
          left: 10px;
        }

        .sc-room-sliding_left .sc-slider-panel-right,
        .sc-room-sliding_right .sc-slider-panel-right {
          right: 10px;
        }

        .sc-room-sliding_left .sc-slider-divider,
        .sc-room-sliding_right .sc-slider-divider {
          position: absolute;
          top: 20px;
          bottom: 10px;
          left: 50%;
          width: 3px;
          margin-left: -1.5px;
          background: rgba(255,255,255,0.82);
        }

        .sc-room-sliding_left .sc-slider-handle,
        .sc-room-sliding_right .sc-slider-handle {
          position: absolute;
          top: 50%;
          width: 5px;
          height: 16px;
          margin-top: -8px;
          border: 2px solid rgba(255,255,255,0.92);
          background: transparent;
          border-radius: 1px;
          z-index: 2;
        }

        .sc-room-sliding_left .sc-slider-handle-right {
          right: 10px;
        }

        .sc-room-sliding_right .sc-slider-handle-left {
          left: 10px;
        }

        .sc-blind-top {
          text-align: center;
          margin-bottom: 1rem;
        }

        .sc-blind-bottom {
          text-align: center;
          margin-top: 1rem;
        }

        .sc-blind-label {
          display: inline-block;
          font-size: 20px;
          vertical-align: middle;
        }

        .sc-blind-position {
          display: inline-block;
          vertical-align: middle;
          padding: 0 6px;
          margin-left: 1rem;
          border-radius: 2px;
          background-color: var(--secondary-background-color);
        }
      `;

      this.appendChild(style);
      this.card.appendChild(allBlinds);
    }

    entities.forEach((entity) => {
      const entityId = typeof entity === "string" ? entity : entity.entity;

      let invertPercentage = false;
      if (entity && entity.invert_percentage) {
        invertPercentage = entity.invert_percentage;
      }

      const blind = _this.card.querySelector('div[data-blind="' + entityId + '"]');
      const slide = blind.querySelector(".sc-blind-selector-slide");
      const picker = blind.querySelector(".sc-blind-selector-picker");
      const picture = blind.querySelector(".sc-blind-selector-picture");
      const pull = blind.querySelector(".sc-blind-pull");
      const pullStem = blind.querySelector(".sc-blind-pull-stem");
      const roller = blind.querySelector(".sc-blind-roller");
      const dragIndicator = blind.querySelector(".sc-drag-indicator");

      const state = hass.states[entityId];
      const friendlyName =
        entity && entity.name
          ? entity.name
          : state
            ? state.attributes.friendly_name
            : "unknown";
      const currentPosition = state ? state.attributes.current_position : "unknown";

      blind.querySelectorAll(".sc-blind-label").forEach((blindLabel) => {
        blindLabel.innerHTML = friendlyName;
      });

      if (roller) {
        roller.style.left = "auto";
        roller.style.transform = "none";
      }

      if (!_this.isUpdating) {
        blind.querySelectorAll(".sc-blind-position").forEach((blindPosition) => {
          blindPosition.innerHTML = currentPosition + "%";
        });

        if (invertPercentage) {
          _this.setPickerPositionPercentage(
            currentPosition,
            picker,
            slide,
            picture,
            pull,
            pullStem,
            dragIndicator
          );
        } else {
          _this.setPickerPositionPercentage(
            100 - currentPosition,
            picker,
            slide,
            picture,
            pull,
            pullStem,
            dragIndicator
          );
        }

        if (dragIndicator) {
          dragIndicator.classList.remove("show");
        }
      }
    });
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error("You need to define entities");
    }

    this.config = config;
    this.isUpdating = false;
  }

  getCardSize() {
    return this.config.entities.length + 1;
  }
}

customElements.define("blinds-and-curtains-card", BlindsAndCurtainsCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "blinds-and-curtains-card",
  name: "Blinds and Curtains",
  preview: true,
  description: "Horizontal curtain control: right-to-left, left-to-right, or edges-to-centre.",
  documentationURL: "https://github.com/flect41/lovelace-blind-card-enhanced",
});
