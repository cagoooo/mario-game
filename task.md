# 🎮 Mario Game 開發進度與優化路線圖

> 最後更新：2026-05-01 ｜ 目前版本：**v2.28.0**
> 專案規模：47 個 JS 模組、約 14,200 行（含註解）

---

## ✅ 已完成階段（依時間順序）

### 第一階段：使用者體驗
- [x] 開始畫面（含標題與說明）
- [x] 暫停功能（ESC 鍵 + 按鈕）
- [x] 全螢幕模式按鈕
- [x] UI 介面優化（分數、按鈕、暫停選單、轉向提示）

### 第二階段：進階視覺效果
- [x] 綠色水管障礙物
- [x] 危險區域（岩漿/水）
- [x] 強化粒子效果

### 第三階段：音效系統
- [x] 背景音樂（Web Audio 生成）
- [x] 落地/撞擊磚塊音效
- [x] 靜音切換按鈕

### 第四階段：更多敵人
- [x] 烏龜 (Koopa) - 被踩踏時縮成龜殼
- [x] 飛行敵人 - 上下彈跳
- [x] 食人花 - 從水管出現

### 第五階段：最佳化與部署
- [x] GitHub Pages 部署
- [x] PWA 支援（Manifest + Service Worker）
- [x] 蘑菇道具
- [x] 滑鼠控制修復（攝影機同步）
- [x] 任意鍵重新開始（鍵盤/滑鼠/觸控）
- [x] 混合輸入支援（Pointer Events 確保滑鼠/觸控穩健）
- [x] 滑鼠邊緣移動修復（全域滑鼠追蹤）
- [x] 按鈕輸入相容性修復（Touchstart/Mousedown 備援）
- [x] 重新開始崩潰修復（遺失的方法實作）
- [x] 部署快取修復（版本標記）

### 第六階段：水管密道與獎勵關卡 (v1.9.8)
- [x] 清理 Game.js 中的重複程式碼
- [x] 優化獎勵關卡設計 (更多金幣、磚塊排列)
- [x] 調整水管密道生成機率與視覺提示
- [x] 驗證進出水管的動畫與狀態切換

### 第七階段：水管密道觸控優化 (v1.9.9)
- [x] 提高水管密道出現機率至 20%
- [x] 為密道水管添加視覺標記（箭頭/高亮）
- [x] 實作點擊水管直接進入的功能（觸控優化）

### 第八階段：披風道具與存檔系統 (v2.17.0)
- [x] 創建 `Cape.js` 披風道具類別
- [x] 玩家滑翔物理機制（按住 Space 在空中減緩下降）
- [x] 整合至問號磚塊掉落系統（5% 機率）
- [x] 實作 `saveProgress()` / `loadProgress()` 進度存檔
- [x] 實作 `applyProgress()` / `clearProgress()` 進度管理

### 第九階段：效能優化與修復 (v2.17.1 ~ v2.17.4) ⭐ 2025-12-19
- [x] 粒子系統效能優化（上限 150 個粒子）
- [x] 天氣粒子減少（200→100, spawn rate 5x→3x）
- [x] 物件清理增強（新增 15+ 物件類型清理）
- [x] FPS 監控器（開發用，預設隱藏）
- [x] 星星無敵速度提升（6.0→7.5）
- [x] 星星 BGM 優化（tempo 180→200, 更華麗旋律）
- [x] iOS Safari 橫向模式修復（svh + safe-area-inset）

### 第十階段：碰撞檢測效能優化 (v2.18.0) ⭐ 2025-12-20
- [x] 整合 SpatialGrid 至 CollisionSystem.js
- [x] 敵人碰撞使用空間過濾（O(N) → 平均 O(1)）
- [x] 問號磚塊碰撞使用空間過濾
- [x] 金幣收集使用空間過濾
- [x] 水管碰撞使用空間過濾
- [x] 平台碰撞使用空間過濾

### 第十一階段：輸入模式智慧切換 (v2.19.0) ⭐ 2025-12-20
- [x] 偵測使用者最後使用的輸入裝置（鍵盤 vs 滑鼠）
- [x] 自動切換 Player 操控行為以符合裝置語意
- [x] PlayerStates 在不同輸入模式下的狀態調整
- [x] 主程式整合 InputHandler 模式偵測訊號

### 第十二階段：操作回饋強化與冰系造型 (v2.24.0) ⭐ 2025-12-20
- [x] 雙重跳躍視覺特效強化（金色 + 白色粒子爆炸）
- [x] 星星無敵時最高速度修正（覆寫 Sprint / Crouch 不再被壓速）
- [x] 冰系玩家造型（icePower 啟用時改穿白褲淺藍衫）
- [x] 道具提示訊息系統 `showPowerUpHint()`（3 秒淡出）
- [x] Koopa / Cactus 結凍視覺效果（藍化 + 冰晶閃爍 overlay）
- [x] icePower / firePower 受傷時優先扣除（再進入縮小判定）

### 第十三階段：直立畫面開放與行動端 UX (v2.25.0) ⭐ 2026-04-01
- [x] 移除強制橫向限制（不再封鎖直立模式）
- [x] 直立模式 canvas 限縮為 45svh（為觸控按鈕留空間）
- [x] 橫向模式維持 100svh（充分利用螢幕）
- [x] 觸控按鈕在所有觸控裝置（含直立）一律顯示
- [x] 直立模式 `#gameUI` 字體 / 按鈕等比縮小

### 第十四階段：技術債三連發 (v2.26.0) ⭐ 2026-05-01
> **動機**：Game.js 等 13 個檔散落 `?v=1.6.22` ~ `?v=2.25.0` 共 13 種版本字串，sw.js cache 路徑寫錯（會 install 失敗），index.html 又把 SW 自動 unregister — 整套 PWA 快取機制已壞但沒人發現。

- [x] **建立 `js/version.js`**（單一版本號真相 — `GAME_VERSION = '2.26.0'`）
- [x] **移除 ES import 上的 `?v=X.Y.Z` 字串**（11 個 JS 檔，共 80+ 處）
  - 動機：ES 靜態 import 不能用模板字串；繼續硬編版本只會持續腐爛
  - 改由 SW `CACHE_NAME` 與 index.html 的 `style.css?v=` / `main.js?v=` 兩個入口統一管控
- [x] **修正 sw.js 的 3 個錯誤路徑**
  - `./css/style.css` → `./style.css`（資料夾根本不存在）
  - `./icon-192.png` → `./assets/icon-192.png`
  - 移除 `./icon-512.png`（檔案不存在）
- [x] **補上 sw.js 漏掉的檔案**：`./js/Platform.js`、`./js/version.js`
- [x] **CACHE_NAME 升至 `mario-game-v2.26.0`**
- [x] **合併 `docs/optimization_roadmap_v2.8.0.md` 至本檔並刪除原檔**
  - 已完成項目（空間分割、JSON 關卡、IceFlower/Cape、Lakitu/Thwomp）標記 done
  - 未完成項目（虛擬搖桿、觸覺回饋、TS 遷移、單元測試）併入下方未來路線
- [x] **`index.html` style.css / main.js 版本字串 → 2.26.0**

### 第十五階段：關卡選擇 + 4 個世界 (v2.27.0) ⭐ 2026-05-01
> **痛點**：玩家進遊戲 = 隨機 biome 永久 streaming，沒有「破關」成就感。

- [x] **`js/Levels.js`** — LEVELS 常數 + 解鎖管理 API
- [x] **NES 風格關卡選擇選單**（黑底黃字、↑↓ Enter 導航）
- [x] **4 個世界**：World 1-1 PLAINS / 1-2 DESERT / 1-3 SNOW / 1-4 SPOOKY
- [x] **Endless Mode** 保留為獨立入口（biome 隨機）
- [x] **`Game` 接受 levelConfig**：levelMode 鎖定 biome + 通關偵測
- [x] **STAGE CLEAR overlay** + 自動解鎖下一關 + 進度持久化
- [x] **觸控支援**：直接點卡片進入

### 第十六階段：PWA 自動更新偵測 (v2.27.1) ⭐ 2026-05-01
> **動機**：v2.27.0 部署後玩家 console 顯示混合版本（新 main.js + 舊 version.js 被舊 SW 服務），證明「bump CACHE_NAME」不夠，需要積極推送機制。套用 `pwa-cache-bust` skill 最佳實踐。

- [x] **SW 分策略快取**：HTML/version.json network-first；`?v=X.Y.Z` 資源 cache-first
- [x] **`version.json`** 端點 — 前端輪詢入口
- [x] **更新 Banner UI** — 偵測新版自動跳出，「立即更新」按鈕（NES 黃邊風格）
- [x] **雙重訊號**：SW updatefound event + version.json polling（每 5 分鐘）
- [x] **`scripts/bump-version.js`** — 一鍵同步 4 處版本號
- [x] **defensive null check**：舊 HTML 不會再 crash 新 JS

### 第十七階段：教學引導重做 (v2.28.0) ⭐ 2026-05-01
> **動機**：v2.13 ~ v2.17 累積的新技能（Sprint、Wall Jump、Cape）新玩家不知道存在；老玩家每次開遊戲都被迫看 cutscene 累積煩躁。

- [x] **版本綁定 first-play 偵測**：`localStorage.marioTutorialSeenVersion` 對比 `TUTORIAL_VERSION` 常數，新版自動補課一次
- [x] **教學步驟擴充**（6 → 8）：新增 Shift 衝刺、↓ 蹲下、牆壁+跳蹬牆跳、披風滑翔
- [x] **道具首次拾取情境提示**：`game.firstTimePickupHint()` API 接入 7 種 power-up（mushroom/star/fire/ice/magnet/mega/cape）
- [x] **暫停選單「重看教學」按鈕**：點下清 flag + dynamic import + 立即重播
- [x] **`bump-version.js` 首次正式啟用**：4 檔同步成功

---

## 📋 未來開發路線圖（建議優先順序）

> 排序原則：**「玩家立刻有感」> 「程式體質」> 「擴展性」**。
> 每項都標註預估工時、影響範圍、實作風險，方便評估要不要進。

---

### 🥇 P0 — 玩家有感、CP 值最高（建議下一個版本就排）

#### 第十五階段：關卡系統正規化（v2.27.x）
> **痛點**：目前 `LevelGenerator.js` 是程序生成 + `levels/world-1-1.json` 只有一個檔案，玩家其實沒有「破關」的成就感。

- [ ] **關卡選擇 UI**（標題畫面新增 World 1-1 / 1-2 / 1-3 卡片）
  - 預估：4 ~ 6 小時
  - 風險：低 — 只需要在 main.js / UIManager 加一層 menu state
  - 收益：高 — 玩家立刻有「進度」感
- [ ] **將現有程序生成關卡輸出成 JSON**
  - 在 `LevelGenerator` 加一個 `serialize()` 方法 → 玩到滿意的關卡可以存成模板
  - 風險：中 — 要先把 spawn 邏輯抽乾淨
- [ ] **多檔關卡資料夾**：`levels/world-1-1.json` ~ `levels/world-1-4.json`
- [ ] **每關 Boss 戰解鎖機制**：通關後寫進 `localStorage.unlockedLevels`
- [ ] **三星評分**（時間 / 金幣收集率 / 不死亡）— 用來推動 replay

#### 第十六階段：教學引導重做（v2.28.x）
> **痛點**：v2.13 加了成就 + v2.14 加了 Sprint + v2.15 加了 Wall Jump，但**新玩家不會知道這些技能存在**。

- [ ] **首次遊玩偵測**：`localStorage.firstPlayDone` flag
- [ ] **情境式 tutorial overlay**：第一次接近水管時跳出「按下方向鍵 ↓ 進入」
- [ ] **技能解鎖通知**：拿到 Cape → 中央彈出大字「按住空白鍵滑翔！」
- [ ] **重新整合 `Tutorial.js`**（目前 164 行，但被多少處呼叫？要稽核）
- [ ] **「設定 → 重看教學」入口**

#### 第十七階段：成就系統內容擴充（v2.29.x）
> v2.13 已做基礎 9 個成就，但**沒有玩家動力**（沒有解鎖獎勵、沒有展示頁）。

- [ ] **成就頁面**（從暫停選單可進入）— 列出所有成就 + 解鎖率
- [ ] **解鎖獎勵綁定**：解鎖某成就 → 開啟某玩家造型 / 某關卡
- [ ] **隱藏成就**（未解鎖時只顯示問號）
- [ ] **新成就建議**（部分來自舊 roadmap 倖存清單）：
  - 🏃 速度跑者（60 秒內 5000 分 → 永久 +5% 移動速度）
  - 💀 BOSS 獵人（擊敗 10 隻 BOSS → 解鎖困難模式）
  - 🪙 金幣大師（單次 500 金幣 → 金幣價值 +1）
  - 🦘 連跳王（連續踩 10 個敵人 → 解鎖三段跳）
  - 🌟 無敵戰神（無敵狀態擊殺 20 敵人 → 無敵時間 +20%）
  - 完美通關（不死）、收集所有披風、結凍 50 隻敵人、雙重跳躍 100 次

---

### 🥈 P1 — 程式體質與長期擴展性

#### 第十八階段：Asset Pipeline 重構（v2.30.x）
> **進度**：v2.26.0 已先做掉「集中版本號常數」與「移除散落的 import 版本字串」兩項；下一步是真正的打包 pipeline。

- [x] ~~**集中版本號常數**：建立 `js/version.js` export `GAME_VERSION`~~（v2.26.0）
- [ ] **build script**：用 esbuild / vite 打包成單一 `bundle.js`
  - 預估：8 小時（含 PWA 重新驗證）
  - 風險：中 — Service Worker 路徑會變
  - 收益：日後改版只要改 `package.json` 版本號，不用全檔改 import
- [ ] **import map**（如果不想 build，至少統一管理）
- [ ] **sw.js cache list 自動產生**（從 `dist/` 或 manifest 掃描，不再手動維護）

#### 第十九階段：物件池全面化（v2.31.x）
> 目前 `ObjectPool.js` 已經存在，但只給少數物件用。

- [ ] **檢視 ObjectPool 使用範圍**：搜尋哪些 `new` 還在熱迴圈裡
- [ ] **粒子物件池**（目前 ParticleSystem 就有上限，但沒池化）
- [ ] **Fireball / Iceball 池化**（每秒 5 顆，60fps 等於 300 個 GC 物件/分鐘）
- [ ] **Coin 收集後不 destroy 而是 release 回池**

#### 第二十階段：渲染優化（v2.32.x）
> 大關卡 + 多敵人 + 天氣時可能掉幀。

- [ ] **離屏 canvas 快取背景**（已部份實作，但 Background.js 可再優化）
- [ ] **dirty rectangle 重繪**（只清需要更新的區域）— 風險高，建議測試
- [ ] **Sprite atlas**：把 `assets/enemy.png` `player.png` `tiles.png` 合併
- [ ] **`requestIdleCallback`** 用於非關鍵任務（成就計算、存檔寫入）

#### 第二十一階段：敵人 AI 抽象化（v2.33.x）
> Enemy.js 目前已有 Koopa、Cactus、HammerBro、Lakitu、Thwomp、Yeti、Ghost⋯⋯，但每個都自己寫 update/draw，重複碼太多。

- [ ] **抽出 `EnemyBehavior` 介面**：`Patrol`, `Chase`, `Bounce`, `Throw`, `Spawn`
- [ ] **AI 決策樹**（簡易行為樹）— 讓敵人可以「攻擊 → 等待 → 反擊」
- [ ] **狀態化敵人**（類似 PlayerStates.js 的 pattern 套用過來）

---

### 🥉 P2 — 內容深度與沉浸感

#### 第二十二階段：音效強化（v2.34.x）
> 目前是 Web Audio 程序生成 — 音色比較單薄。

- [ ] **加入採樣音檔**（短小 .ogg，PWA cache 一次就好）
- [ ] **動態 BGM 切換**（無敵時 / Boss 戰 / 水下關 — 已部分有）
- [ ] **位置音效**（敵人在右邊就右聲道大聲）
- [ ] **音效淡入淡出曲線**（避免突兀切換）

#### 第二十三階段：視覺風格升級（v2.35.x）
- [ ] **天氣轉場動畫**（從晴 → 雨需要漸變）
- [ ] **背景視差層次再加**（目前已有，可再加遠山 / 雲層）
- [ ] **角色受傷的 hit-stop**（短暫凍幀 + 紅色閃爍 — 已部分有）
- [ ] **道具拾取慢動作**（取得 Mega Mushroom 那一幀放慢 200ms）
- [ ] **CRT 復古濾鏡選項**（暫停選單可開關）

#### 第二十四階段：新道具與機制（v2.36.x）
- [ ] **磁鐵升級**（Magnet.js 已存在 — 加上「吸引半徑視覺化」）
- [ ] **時間倒流道具**（3 秒前位置）
- [ ] **無敵盾**（單次抵擋傷害，視覺上多一層光暈）
- [ ] **二段傘** / **彈跳鞋** / **滑板**
- [ ] **披風動畫**（task 早就列了 — 真的該做了）
- [ ] **狸貓尾巴 (Raccoon Tail)**（旋轉攻擊 + P-meter 助跑飛行 — 來自舊 roadmap）

#### 第二十五階段：Boss 戰深度（v2.37.x）
- [ ] **Boss 三階段血量條**（現在 Boss.js 是不是只有單階段？要看）
- [ ] **Boss 攻擊樣式輪替**
- [ ] **Boss 戰專屬鏡頭**（鎖視角 / 鏡頭縮放）
- [ ] **失敗後 Boss 嘲諷對話**（增加挑戰意願）

#### 第二十六階段：行動端控制升級（v2.38.x）
> 來自舊 roadmap — v2.25.0 開放直立模式後，觸控體驗的下一步。

- [ ] **虛擬搖桿** (取代左右按鈕)
  - 預估：3 ~ 4 小時
  - 半透明底座 + 拇指拖曳，比固定按鈕直覺
  - 可設定為「按鈕 / 搖桿」二選一
- [ ] **觸覺回饋** (`navigator.vibrate`)
  - 受傷：`[100, 50, 100]` 短-暫停-短
  - 收金幣：`50` 輕微
  - Boss 擊敗：`[200, 100, 200, 100, 400]` 強烈
  - 預估：1 小時（多數設備已支援，零風險）

---

### 🎯 P3 — 社群、無障礙、長尾

#### 第二十七階段：無障礙（a11y）
- [ ] **可重新綁定按鍵**（不是每個玩家都用 WASD）
- [ ] **色盲模式**（紅綠色盲 / 全色盲調色盤）
- [ ] **可關閉螢幕震動 / 閃光**（光敏感患者必要）
- [ ] **字體大小縮放**（UI 至少 3 級）
- [ ] **慢速模式**（給小朋友 / 復健玩家 — 50% 速度）

#### 第二十八階段：社群與分享
- [ ] **截圖分享**（Web Share API + canvas.toBlob）
- [ ] **本機高分榜 → 雲端**（用 Supabase 免費方案，每天上傳一次）
- [ ] **每日挑戰種子**（同一天全世界玩同一份隨機關卡）
- [ ] **錄製 GIF**（用 gif.js — 短 5 秒精彩瞬間）

#### 第二十九階段：開發者體驗
- [ ] **關卡編輯器**（內建在遊戲裡 — 偵測 ?editor=1 query）
- [ ] **除錯面板**（顯示碰撞框、AI 狀態、FPS、記憶體）
- [ ] **重播系統**（記錄 input 序列就能 replay — Quake 那套）
- [ ] **單元測試**（Jest + canvas-mock；至少 utils.js / SpatialGrid.js / CollisionSystem.js）
- [ ] **TypeScript 漸進遷移**（順序：Config → utils → 實體類別 → Game.ts；來自舊 roadmap）

---

## 🐛 已知技術債清單（沒人催但該還）

- [x] ~~**Game.js import 版本字串混亂**~~ — 已於 v2.26.0 全面清除
- [x] ~~**Service Worker cache list 路徑錯誤**~~ — 已於 v2.26.0 修正（css 路徑、icon 路徑、漏掉 Platform.js）
- [x] ~~**`docs/optimization_roadmap_v2.8.0.md` 已過時**~~ — v2.26.0 合併本檔後刪除
- [ ] **Service Worker cache list 仍需手動維護**（每加一個檔還是要記得加 sw.js）— 待 v2.30.0 build pipeline 解
- [ ] **`index.html` 自動 unregister Service Worker**（line 105 ~ 112 的開發 hack 還在 — 真正部署時 PWA 還是不會生效）
- [ ] **Magic numbers 散落各處**（重力 0.5、跳躍力 -12⋯⋯ 該集中到 `Config.js`）
- [ ] **`debug_images.html`** 是不是該清掉？（如果只是早期測試用）
- [ ] **`walkthrough.md`** 內容跟現在的關卡有沒有對齊？

---

## 📊 建議的版本節奏

| 階段 | 版號 | 內容 | 預估週數 |
|------|------|------|----------|
| ✅ 剛完成 | v2.26.0 | 技術債三連發（version.js / sw.js / 過期 doc） | 半天 |
| 下一版 | v2.27.0 | 關卡選擇 UI + JSON 化 | 1 ~ 2 週 |
| 接著 | v2.28.0 | 教學引導重做 | 1 週 |
| 之後 | v2.29.0 | 成就頁面 + 解鎖獎勵 | 1 週 |
| 季度大改 | v3.0.0 | Build pipeline + 重構 | 2 ~ 3 週 |

> 💡 建議**每兩到三個小版本**穿插一次「程式體質」議題，避免技術債爆掉。
> 例如：v2.27（玩家有感）→ v2.28（玩家有感）→ v2.29（玩家有感）→ v2.30（程式體質）⋯⋯

---

## 🎓 本進度表使用守則

1. 每完成一個 task，把 `[ ]` 改成 `[x]` 並加上版號標籤
2. 新增 phase 時，沿用「第 N 階段：標題 (vX.Y.Z)」格式
3. **DEVLOG.md 寫「做了什麼」、task.md 寫「打算做什麼」**，分工明確
4. 任何 P0 新提議要先評估「玩家當下有感嗎？」再決定動工
5. 改版時 **`js/version.js` 與 `sw.js` 的 `CACHE_NAME` 必須同步**（v2.26.0 起的鐵則）
