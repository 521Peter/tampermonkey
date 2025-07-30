// ==UserScript==
// @name         自动化任务开发工具
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  通过UI界面控制开发模式，无需修改脚本代码即可注入和测试新脚本。
// @author       liuguanghui
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  // ==================================================================
  // 1. 样式定义：决定UI面板的外观
  // ==================================================================
  const styles = `
        #dev-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            background-color: #282c34;
            color: #abb2bf;
            border: 1px solid #444;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            font-family: Consolas, Monaco, monospace;
            z-index: 99999;
            transition: all 0.3s ease;
            overflow: hidden; /* 用于收缩动画 */
        }
        #dev-panel.collapsed {
            height: 40px;
            width: 150px;
        }
        #dev-panel-header {
            padding: 10px;
            background-color: #3c4049;
            cursor: pointer;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #dev-panel-body {
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .dev-row {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #dev-code-textarea {
            width: 98%;
            height: 200px;
            background-color: #21252b;
            color: #abb2bf;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 5px;
            resize: vertical;
        }
        #save-dev-settings {
            padding: 8px 15px;
            background-color: #61afef;
            color: #282c34;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            transition: background-color 0.2s;
        }
        #save-dev-settings:hover {
            background-color: #529bea;
        }
        /* Switch开关样式 */
        .switch { position: relative; display: inline-block; width: 50px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #4c515d; transition: .4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #61afef; }
        input:checked + .slider:before { transform: translateX(26px); }
    `;

  // ==================================================================
  // 2. 注入UI到页面
  // ==================================================================
  // 等待DOM加载完毕再创建UI
  window.addEventListener("DOMContentLoaded", () => {
    // 注入CSS样式
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // 创建HTML结构
    const panel = document.createElement("div");
    panel.id = "dev-panel";
    panel.innerHTML = `
            <div id="dev-panel-header">
                <span>⚙️ 开发设置</span>
                <span id="collapse-btn">[-]</span>
            </div>
            <div id="dev-panel-body">
                <div class="dev-row">
                    <label class="switch">
                        <input type="checkbox" id="dev-mode-toggle">
                        <span class="slider"></span>
                    </label>
                    <span>启用开发模式</span>
                </div>
                <textarea id="dev-code-textarea" placeholder="在此粘贴你的开发代码..."></textarea>
                <button id="save-dev-settings">💾 保存并应用</button>
            </div>
        `;
    document.body.appendChild(panel);

    // 获取UI元素
    const devModeToggle = document.getElementById("dev-mode-toggle");
    const codeTextarea = document.getElementById("dev-code-textarea");
    const saveButton = document.getElementById("save-dev-settings");
    const panelHeader = document.getElementById("dev-panel-header");

    // ==================================================================
    // 3. UI交互逻辑
    // ==================================================================
    // 从存储中加载并设置UI初始状态
    devModeToggle.checked = GM_getValue("isDevMode", false);
    codeTextarea.value = GM_getValue("devCode", "");

    // 保存按钮事件
    saveButton.addEventListener("click", () => {
      GM_setValue("isDevMode", devModeToggle.checked);
      GM_setValue("devCode", codeTextarea.value);
      alert("设置已保存！请刷新页面以应用更改。");
      window.location.reload(); // 自动刷新页面
    });

    // 面板折叠/展开事件
    panelHeader.addEventListener("click", (e) => {
      if (e.target.id === "collapse-btn" || e.target === panelHeader) {
        panel.classList.toggle("collapsed");
        document.getElementById("collapse-btn").innerText =
          panel.classList.contains("collapsed") ? "[+]" : "[-]";
      }
    });
  });

  // ==================================================================
  // 4. 核心逻辑：在脚本开始时检查模式并执行相应操作
  // ==================================================================
  // 从存储中读取配置
  const isDevMode = GM_getValue("isDevMode", false);
  const devCode = GM_getValue("devCode", "");

  // 确保在 onaftersubmit 框架加载后执行
  setTimeout(() => {
    if (isDevMode && devCode.trim() !== "") {
      // 如果是开发模式，并且代码不为空
      if (window.onaftersubmit) {
        console.log(
          "%c[UI工具] 启动开发模式！正在注入本地代码...",
          "color: orange; font-weight: bold;"
        );
        window.onaftersubmit.setISDev(true);
        window.onaftersubmit.setResetScript(devCode);
      } else {
        console.error("[UI工具] 未找到 onaftersubmit 框架或其不支持开发模式！");
      }
    } else {
      // 否则，执行默认的生产模式（即什么都不做，让框架自行运行）
      console.log(
        "%c[UI工具] 启动生产模式。",
        "color: lightgreen; font-weight: bold;"
      );
    }
  }, 500); // 延时以确保 `window.onaftersubmit` 对象已准备好
})();
