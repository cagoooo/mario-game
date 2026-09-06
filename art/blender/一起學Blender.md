# 從這款遊戲開始學 Blender

這份練習有三個原創遊戲物件：探索寶石、彈簧、移動浮台。物件名稱使用中文，模型、材質、燈光和相機保留在可編輯的 `.blend` 檔中。

## 第一次打開

開啟 `adventure-starter.blend`。先用右上方的物件清單選取「01｜探索寶石」，再練習：

1. 滑鼠滾輪縮放，中鍵拖曳旋轉視角，Shift＋中鍵平移。
2. `G` 移動、`R` 旋轉、`S` 縮放；接著按 X／Y／Z 可限制軸向。右鍵或 Esc 取消，左鍵確認。
3. 在材質頁改寶石的底色。`F12` 渲染展示相機畫面。
4. 使用「另存新檔」保留自己的練習版本。

筆電沒有中鍵時，可用視窗右上方的導覽軸與縮放／平移圖示。

## 與網頁遊戲的關係

目前正式遊戲畫面由 Canvas 2D 繪製，執行遊戲不需要安裝 Blender。這份 `.blend` 是素材製作的第一個練習，尚未接替遊戲內的圖像。

適合目前架構的下一步，是把模型用固定正交相機渲染成透明 PNG 動畫格，再交給現有 SpriteAnimator 播放。碰撞盒仍使用遊戲的邏輯尺寸；圖片的裝飾邊緣不應改變平台是否站得住。

若未來要能自由旋轉鏡頭的 3D 關卡，再用 `.glb` 模型與 WebGL 渲染器製作獨立原型，並測試手機效能、碰撞、觸控與離線體積。

## 素材約定

- 寶石以中心為錨點；浮台、彈簧以底部中心為錨點。
- 保留原創模型、材質、燈光與相機，避免只有最後 PNG。
- 先以 128／256 像素素材做手機測試；動畫先做 8～12 格。
- 新素材先接到單一探索關卡驗證，再推廣到其他關卡。
- `create_starter_scene.py` 可重建場景，為避免覆蓋作品，輸出已存在時會停止。

官方學習資料：[Blender 操作手冊](https://docs.blender.org/manual/en/latest/)、[正交相機](https://docs.blender.org/manual/en/3.0/editors/3dview/navigate/projections.html)、[glTF／GLB 匯出](https://docs.blender.org/manual/en/4.3/addons/import_export/scene_gltf2.html)。
