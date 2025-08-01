// ==UserScript==
// @name         【UI版】自动化任务开发工具
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  注入和测试新脚本
// @author       liuguanghui
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      pic.stargamedjs.net
// ==/UserScript==

(function () {
  "use strict";

  // --- CONFIGURATION ---
  // ▼▼▼ 在这里配置您的线上脚本地址 ▼▼▼
  const TRANSFORM_URL = "https://pic.stargamedjs.net/h5vs/t/v0.2.5.1-reset.js";
  // ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲

  const styles = `
        #dev-panel { position: fixed; bottom: 20px; right: 20px; width: 350px; background-color: #282c34; color: #abb2bf; border: 1px solid #444; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); font-family: Consolas, Monaco, monospace; z-index: 99999; transition: all 0.3s ease; overflow: hidden; }
        #dev-panel.collapsed { height: 40px; width: 150px; }
        #dev-panel-header { padding: 10px; background-color: #3c4049; cursor: pointer; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
        #dev-panel-body { padding: 15px; display: flex; flex-direction: column; gap: 15px; }
        .dev-row { display: flex; align-items: center; gap: 10px; }
        #dev-code-textarea { width: 98%; height: 200px; background-color: #21252b; color: #abb2bf; border: 1px solid #444; border-radius: 4px; padding: 5px; resize: vertical; }
        #save-dev-settings { padding: 8px 15px; background-color: #61afef; color: #282c34; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background-color 0.2s; }
        #save-dev-settings:hover { background-color: #529bea; }
        .switch { position: relative; display: inline-block; width: 50px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #4c515d; transition: .4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #61afef; }
        input:checked + .slider:before { transform: translateX(26px); }
    `;

  window.addEventListener("DOMContentLoaded", () => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    const panel = document.createElement("div");
    panel.id = "dev-panel";
    panel.innerHTML = `
            <div id="dev-panel-header"><span>⚙️ 开发设置</span><span id="collapse-btn">[-]</span></div>
            <div id="dev-panel-body">
                <div class="dev-row"><label class="switch"><input type="checkbox" id="dev-mode-toggle"><span class="slider"></span></label><span>启用开发模式</span></div>
                <textarea id="dev-code-textarea" placeholder="在此粘贴你的开发代码..."></textarea>
                <button id="save-dev-settings">💾 保存并应用</button>
            </div>
        `;
    document.body.appendChild(panel);

    const devModeToggle = document.getElementById("dev-mode-toggle");
    const codeTextarea = document.getElementById("dev-code-textarea");
    const saveButton = document.getElementById("save-dev-settings");
    const panelHeader = document.getElementById("dev-panel-header");

    devModeToggle.checked = GM_getValue("isDevMode", false);
    codeTextarea.value = GM_getValue("devCode", "");

    saveButton.addEventListener("click", () => {
      GM_setValue("isDevMode", devModeToggle.checked);
      GM_setValue("devCode", codeTextarea.value);
      alert("设置已保存！将刷新页面以应用更改。");
      window.location.reload();
    });

    panelHeader.addEventListener("click", (e) => {
      if (e.target.id === "collapse-btn" || e.target === panelHeader) {
        panel.classList.toggle("collapsed");
        document.getElementById("collapse-btn").innerText =
          panel.classList.contains("collapsed") ? "[+]" : "[-]";
      }
    });
  });

  // --- Main Logic ---
  async function main() {
    const isDevMode = GM_getValue("isDevMode", false);
    const devCode = GM_getValue("devCode", "");

    // Wait for the onaftersubmit framework to be ready
    await new Promise((resolve) => setTimeout(resolve, 500));

    let insertScript = await new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: TRANSFORM_URL,
        onload: function (response) {
          console.log("请求成功！");
          const resultText = response.responseText;
          // console.log("返回的文本内容: \n", resultText);
          resolve(resultText);
        },
        onerror: function (error) {
          console.error("请求失败！");
          console.error("错误详情: ", response.statusText);
          reject(error);
        },
      });
    });

    console.log(`[UI工具] 脚本加载成功，共 ${insertScript.length} 字节。`);
    const removeTrailingSemicolon = (str) => {
      str = str.trim();
      if (str.endsWith(";")) {
        str = str.slice(0, -1);
      }
      return str;
    };

    if (isDevMode && devCode.trim() !== "") {
      // Development Mode
      console.log(
        "%c[UI工具] 启动开发模式！正在注入本地代码...",
        "color: orange; font-weight: bold;"
      );
      // window.onaftersubmit.setISDev(true);
      // window.onaftersubmit.setResetScript(devCode);
      insertScript += `window.onaftersubmit.setDefaultParams(${JSON.stringify(
        {}
      )});window.onaftersubmit.setISDev(true);window.onaftersubmit.setResetScript(${JSON.stringify(
        removeTrailingSemicolon(devCode)
      )})`;
    } else {
      // Production Mode
      console.log(
        "%c[UI工具] 启动生产模式。正在从URL拉取脚本...",
        "color: lightgreen; font-weight: bold;"
      );
      try {
        insertScript;
        // new Function(responseText)();
      } catch (error) {
        console.error("[UI工具] 拉取生产脚本失败:", error);
      }
    }
  }

  main();
})();
