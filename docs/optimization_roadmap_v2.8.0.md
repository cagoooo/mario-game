# 優化與改良建議 (v2.8.0+)

基於 v2.8.0 版本的程式碼分析，以下是後續開發的詳細建議與優先順序。

---

## 🔴 Phase 4: 效能優化 (高優先級)

### 4.1 空間分割碰撞檢測 (Spatial Partitioning)

**現狀問題：**
目前碰撞檢測為 O(N) 複雜度，每幀檢查所有實體。隨著關卡延伸，效能會逐漸下降。

**建議方案：**

```javascript
// 新增 js/SpatialGrid.js
export class SpatialGrid {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    // 將實體加入對應的網格單元
    insert(entity) {
        const cellKey = this.getCellKey(entity.x, entity.y);
        if (!this.grid.has(cellKey)) {
            this.grid.set(cellKey, []);
        }
        this.grid.get(cellKey).push(entity);
    }
    
    // 只查詢鄰近單元內的實體
    getNearby(x, y, radius = 1) {
        const entities = [];
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const key = this.getCellKey(x + dx * this.cellSize, y + dy * this.cellSize);
                const cell = this.grid.get(key);
                if (cell) entities.push(...cell);
            }
        }
        return entities;
    }
    
    getCellKey(x, y) {
        return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    }
    
    clear() {
        this.grid.clear();
    }
}
```

**修改範圍：**
- [NEW] `js/SpatialGrid.js`
- [MODIFY] `js/CollisionSystem.js` - 使用 SpatialGrid 取代陣列遍歷
- [MODIFY] `js/Game.js` - 每幀更新空間網格

**預期效果：** 碰撞檢測效能提升 3-5 倍

---

### 4.2 離屏 Canvas 渲染優化

**現狀問題：**
靜態背景元素每幀重新繪製，浪費 GPU 資源。

**建議方案：**

```javascript
// 在 Background.js 中實作
export class Background {
    constructor(width, groundY) {
        // 建立離屏 Canvas 快取靜態元素
        this.staticCanvas = document.createElement('canvas');
        this.staticCtx = this.staticCanvas.getContext('2d');
        this.needsRedraw = true;
    }
    
    renderStaticLayer() {
        if (!this.needsRedraw) return;
        
        // 繪製不會變化的元素：山脈、雲朵位置、裝飾物
        this.drawMountains(this.staticCtx);
        this.drawDecor(this.staticCtx);
        
        this.needsRedraw = false;
    }
    
    draw(ctx, camera) {
        // 直接繪製快取的靜態層
        ctx.drawImage(this.staticCanvas, -camera.x * 0.3, 0);
        
        // 只即時繪製動態元素（動畫雲朵、粒子等）
        this.drawDynamicElements(ctx, camera);
    }
}
```

**修改範圍：**
- [MODIFY] `js/Background.js` - 實作雙 Canvas 架構

**預期效果：** 繪製效能提升 20-30%

---

## 🟡 Phase 5: 遊戲內容擴充 (中優先級)

### 5.1 JSON 關卡編輯器支援

**目標：** 支援外部 JSON 檔案定義精確的關卡佈局，結合程序化生成。

**檔案格式設計：**

```json
{
    "name": "World 1-1",
    "width": 3000,
    "biome": "PLAINS",
    "platforms": [
        { "x": 100, "y": 300, "width": 200, "type": "brick" },
        { "x": 400, "y": 250, "width": 100, "type": "floating" }
    ],
    "enemies": [
        { "x": 500, "type": "goomba" },
        { "x": 800, "type": "koopa" }
    ],
    "items": [
        { "x": 300, "y": 200, "type": "questionBlock", "content": "coin" }
    ],
    "pipes": [
        { "x": 600, "type": "entrance", "destination": "bonus-1" }
    ]
}
```

**新增檔案：**

```javascript
// js/LevelLoader.js
export class LevelLoader {
    async load(levelPath) {
        const response = await fetch(levelPath);
        const data = await response.json();
        return this.parse(data);
    }
    
    parse(data) {
        return {
            platforms: data.platforms.map(p => new Platform(p.x, p.y, p.width)),
            enemies: data.enemies.map(e => this.createEnemy(e)),
            items: data.items.map(i => this.createItem(i)),
            // ...
        };
    }
}
```

**修改範圍：**
- [NEW] `js/LevelLoader.js`
- [NEW] `levels/world-1-1.json` (範例關卡)
- [MODIFY] `js/Game.js` - 支援載入 JSON 關卡

---

### 5.2 新增道具系統

#### 5.2.1 冰花 (Ice Flower)
- **效果：** 發射冰球，凍結敵人 3 秒
- **外觀：** 白色/淺藍色花朵
- **凍結敵人變成可站立的平台**

#### 5.2.2 披風 (Cape)
- **效果：** 滑翔能力，按住跳躍鍵可緩慢下降
- **操作：** 空中按住 Space 啟動滑翔
- **持續時間：** 無限（直到被攻擊）

#### 5.2.3 尾巴 (Raccoon Tail)
- **效果：** 旋轉攻擊 + 短暫飛行
- **操作：** 按 X 鍵旋轉攻擊，連續跳躍可飛行
- **飛行限制：** P-meter 機制（需要助跑）

**檔案結構：**
```
js/
├── IceFlower.js
├── Cape.js
├── RaccoonTail.js
└── Iceball.js
```

---

### 5.3 新敵人類型

| 敵人 | 行為 | 生態系 |
|------|------|--------|
| **Lakitu** | 在雲上飛行，投擲刺蝟 | 天空 |
| **Thwomp** | 固定位置，玩家接近時砸下 | 城堡 |
| **Dry Bones** | 骷髏烏龜，被踩後會復活 | 鬼屋 |
| **Chain Chomp** | 被鏈條限制範圍，衝向玩家 | 城堡 |
| **Podoboo** | 從岩漿跳出的火球 | 城堡 |

---

## 🟢 Phase 6: UI/UX 改善 (中優先級)

### 6.1 虛擬搖桿控制 (觸控裝置)

**現狀問題：**
目前的觸控按鈕佔用螢幕空間，不夠直覺。

**建議方案：**

```javascript
// js/VirtualJoystick.js
export class VirtualJoystick {
    constructor(container) {
        this.baseRadius = 60;
        this.stickRadius = 30;
        this.position = { x: 80, y: container.height - 100 };
        
        this.touchStart = null;
        this.direction = { x: 0, y: 0 };
    }
    
    handleTouch(e) {
        const touch = e.touches[0];
        const dx = touch.clientX - this.position.x;
        const dy = touch.clientY - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.baseRadius) {
            // 正規化到邊界
            this.direction.x = dx / distance;
            this.direction.y = dy / distance;
        } else {
            this.direction.x = dx / this.baseRadius;
            this.direction.y = dy / this.baseRadius;
        }
    }
    
    draw(ctx) {
        // 繪製半透明底座
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
        
        // 繪製搖桿
        const stickX = this.position.x + this.direction.x * this.baseRadius * 0.8;
        const stickY = this.position.y + this.direction.y * this.baseRadius * 0.8;
        ctx.beginPath();
        ctx.arc(stickX, stickY, this.stickRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}
```

---

### 6.2 成就系統 UI 改善

**建議新增成就：**

| 成就名稱 | 條件 | 獎勵 |
|----------|------|------|
| 🏃 速度跑者 | 60秒內達到 5000 分 | 永久 5% 移動速度 |
| 💀 BOSS 獵人 | 擊敗 10 隻 BOSS | 解鎖困難模式 |
| 🪙 金幣大師 | 單次遊戲收集 500 金幣 | 金幣價值 +1 |
| 🦘 連跳王 | 連續踩 10 個敵人 | 解鎖三段跳 |
| 🌟 無敵戰神 | 無敵狀態擊殺 20 敵人 | 無敵時間 +20% |

---

### 6.3 觸覺回饋 (Haptic Feedback)

```javascript
// 在 InputHandler.js 中添加
vibrate(pattern) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// 使用範例
onPlayerHit() {
    this.vibrate([100, 50, 100]); // 短-暫停-短
}

onCollectCoin() {
    this.vibrate(50); // 輕微振動
}

onBossDefeat() {
    this.vibrate([200, 100, 200, 100, 400]); // 強烈振動
}
```

---

## 🔵 Phase 7: 技術債務清理 (低優先級)

### 7.1 TypeScript 遷移

**好處：**
- 類型安全，減少執行時期錯誤
- 更好的 IDE 支援與自動完成
- 重構更安全

**遷移順序：**
1. `Config.ts` (最簡單)
2. `utils.ts`
3. 實體類別 (Player, Enemy, etc.)
4. 最後是 `Game.ts`

### 7.2 單元測試

**建議使用：** Jest + Canvas Mock

```javascript
// __tests__/Player.test.js
describe('Player', () => {
    test('should jump when grounded', () => {
        const player = new Player(mockGame, 0, 0);
        player.grounded = true;
        player.jump();
        
        expect(player.velY).toBe(-16);
        expect(player.grounded).toBe(false);
    });
    
    test('should not double jump without ability', () => {
        const player = new Player(mockGame, 0, 0);
        player.grounded = false;
        player.jumpCount = 2;
        
        const result = player.jump();
        expect(result).toBe(false);
    });
});
```

---

## 📋 優先順序總覽

| 階段 | 難度 | 預估時間 | 影響範圍 |
|------|------|----------|----------|
| **Phase 4.1** 空間分割 | ⭐⭐⭐ | 4-6 小時 | 效能 +50% |
| **Phase 4.2** 離屏 Canvas | ⭐⭐ | 2-3 小時 | 效能 +20% |
| **Phase 5.1** JSON 關卡 | ⭐⭐⭐ | 6-8 小時 | 可擴展性 |
| **Phase 5.2** 新道具 | ⭐⭐⭐⭐ | 8-12 小時 | 遊戲內容 |
| **Phase 5.3** 新敵人 | ⭐⭐⭐ | 6-8 小時 | 遊戲內容 |
| **Phase 6.1** 虛擬搖桿 | ⭐⭐ | 3-4 小時 | 行動體驗 |
| **Phase 6.2** 成就改善 | ⭐⭐ | 2-3 小時 | 參與度 |
| **Phase 7** 技術債務 | ⭐⭐⭐⭐⭐ | 20+ 小時 | 可維護性 |

---

## 🎯 建議實作順序

1. **短期 (1-2 週)**
   - Phase 4.1 空間分割 (效能瓶頸)
   - Phase 4.2 離屏 Canvas

2. **中期 (3-4 週)**
   - Phase 5.1 JSON 關卡系統
   - Phase 6.1 虛擬搖桿

3. **長期 (1-2 月)**
   - Phase 5.2 新道具
   - Phase 5.3 新敵人
   - Phase 6.2 成就系統

4. **維護期**
   - Phase 7 TypeScript 遷移
   - 單元測試覆蓋
