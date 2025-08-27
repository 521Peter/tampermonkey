// ==UserScript==
// @name         cwm-srcipt-runner
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  try to take over the world!
// @author       lgh
// @match        https://cwm.gamegoing.com/strategy/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @updateURL    https://raw.githubusercontent.com/521Peter/tampermonkey/refs/heads/master/cwm-script-runner.js
// @downloadURL  https://raw.githubusercontent.com/521Peter/tampermonkey/refs/heads/master/cwm-script-runner.js
// ==/UserScript==

(function () {
  "use strict";

  // 配置常量
  const CONFIG = {
    containerStyle: {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: "9999",
      padding: "10px",
      background: "white",
      border: "1px solid #ccc",
      borderRadius: "5px",
      boxShadow: "0 0 10px rgba(0,0,0,0.2)",
    },
    inputStyle: {
      marginRight: "10px",
      padding: "5px",
    },
    buttonStyle: {
      padding: "5px 10px",
      background: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "3px",
      cursor: "pointer",
    },
    checkboxContainerStyle: {
      display: "inline-flex",
      alignItems: "center",
      marginRight: "10px",
    },
    checkboxStyle: {
      marginRight: "5px",
    },
    checkboxLabelStyle: {
      fontSize: "14px",
    },
    defaultName: "",
    jsCodeBase: "http://192.168.101.182:5500/dev/",
    jsCodeBase_Prod: "https://pic.stargamedjs.net/ext/v0.2.4-stream.js",
    jsReplace_Prod: "https://pic.stargamedjs.net/ext/v0.2.4-iframe.js",
    reset_Prod: "https://pic.stargamedjs.net/ext/v0.2.4-reset.js",
  };

  // 存储工具函数
  const Storage = {
    save: (key, value) => {
      try {
        localStorage.setItem(`cwm_script_${key}`, value);
      } catch (e) {
        console.warn("Failed to save to localStorage:", e);
      }
    },

    load: (key, defaultValue = "") => {
      try {
        return localStorage.getItem(`cwm_script_${key}`) || defaultValue;
      } catch (e) {
        console.warn("Failed to load from localStorage:", e);
        return defaultValue;
      }
    },
  };

  const Data = {
    showTheme: true,
    url: "",
    userName: Storage.load("userName", CONFIG.defaultName),
    isCollapsed: false,
    transformUrl: Storage.load("transformUrl", ""),
  };

  // 工具函数
  const Utils = {
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),

    simulateInput: (element, text) => {
      element.value = text;
      ["input", "change", "keydown", "keypress", "keyup"].forEach(
        (eventType) => {
          element.dispatchEvent(new Event(eventType, { bubbles: true }));
        }
      );
      return element;
    },

    isSelectorUnique: (selector) =>
      document.querySelectorAll(selector).length === 1,

    getFileNameFromUrl: (url) => {
      try {
        return new URL(url).hostname.replace("www.", "").split(".").join("-");
      } catch {
        return "default";
      }
    },

    waitForValue(selector, interval = 200, timeout = 10000) {
      return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkInterval = setInterval(() => {
          const element = document.querySelector(selector);

          // 如果元素存在且有值
          if (element && element.value) {
            clearInterval(checkInterval);
            resolve(element.value);
          }

          // 如果超时
          if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            reject(new Error(`Timeout waiting for value of ${selector}`));
          }
        }, interval);
      });
    },
  };

  // DOM操作模块
  const DomHelper = {
    createElement: (tag, styles = {}, attributes = {}) => {
      const element = document.createElement(tag);
      Object.assign(element.style, styles);
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
      return element;
    },

    findElementByText: (elements, text) => {
      return Array.from(elements).find((el) => el.textContent.trim() === text);
    },
  };

  // 业务逻辑模块
  const BusinessLogic = {
    async updateConfig() {
      try {
        // 1. 填写名称并查询
        const nameInputs = document.querySelectorAll(
          '.ivu-input-wrapper > input[type="text"]'
        );
        if (nameInputs.length < 2) throw new Error("找不到名称输入框");
        Utils.simulateInput(nameInputs[1], Data.userName);

        const queryBtn = document.querySelector(
          ".ivu-form-item-content > .ivu-btn.ivu-btn-primary"
        );
        if (!queryBtn) throw new Error("找不到查询按钮");
        queryBtn.click();

        await Utils.sleep(2000);

        // 2. 检查结果并点击编辑
        if (!Utils.isSelectorUnique(".table-tr")) {
          throw new Error("搜索的内容不是唯一的");
        }

        const editBtn = DomHelper.findElementByText(
          document.querySelectorAll(".operate-container a"),
          "编辑"
        );
        if (!editBtn) throw new Error("找不到编辑按钮");
        editBtn.click();

        await Utils.waitForValue(".ivu-select-input");

        // 3. 点击下一步按钮
        const nextStepBtns = document.querySelectorAll(
          ".common-botfix-btn-container .ivu-btn.ivu-btn-primary"
        );
        if (nextStepBtns.length < 2) throw new Error("找不到下一步按钮");
        nextStepBtns[0].click();
        nextStepBtns[1].click();

        document.querySelector(".ivu-icon-ios-expand").click();
        await Utils.sleep(800);

        // 4. 修改配置
        const textareas = document.querySelectorAll(
          '.ivu-modal-body > .ivu-input-wrapper > textarea[wrap="soft"]'
        );
        if (textareas.length < 2) throw new Error("找不到配置输入框");

        const configStr = textareas[1].value;
        if (!configStr) throw new Error("找不到配置");

        const configObj = JSON.parse(configStr);

        Utils.simulateInput(
          textareas[1],
          JSON.stringify(this.setConfig(configObj), null, 2)
        );

        const modalButtons = document.querySelectorAll(
          ".ivu-modal-fullscreen .ivu-modal-footer .ivu-btn-primary"
        );
        if (modalButtons.length < 2) throw new Error("找不到模态框确认按钮");
        modalButtons[1].click();

        // 5. 保存并返回
        const saveBtn = DomHelper.findElementByText(
          document.querySelectorAll(
            ".common-botfix-btn-container button.ivu-btn-primary span"
          ),
          "保存"
        );
        if (!saveBtn) throw new Error("找不到保存按钮");
        saveBtn.parentElement.click();

        const backBtn = DomHelper.findElementByText(
          document.querySelectorAll(
            ".common-botfix-btn-container .ivu-btn-default span"
          ),
          "返回"
        );
        if (!backBtn) throw new Error("找不到返回按钮");
        backBtn.parentElement.click();

        return true;
      } catch (error) {
        alert(error.message);
        return false;
      }
    },
    setConfig(configObj) {
      let firstUrlObj = configObj.urls[0];
      if (Data.url) {
        firstUrlObj = {
          ...firstUrlObj,
          url: Data.url,
        };
      }
      if (Data.transformUrl) {
        firstUrlObj = {
          ...firstUrlObj,
          name: `name:woso,groupRate:1,limit:8000,level:1,childRate:1,hotRate:0,dev:0,logTest:1,transformRate:1,actions:wait&3000_click,transformUrl:${btoa(
            Data.transformUrl
          )}`,
        };
      }
      configObj.urls[0] = firstUrlObj;
      configObj.showTheme = Data.showTheme ? 1 : 0;
      return configObj;
    },
  };

  // 初始化UI
  function initUI() {
    const container = DomHelper.createElement("div", CONFIG.containerStyle);

    // 创建折叠按钮
    const toggleButton = DomHelper.createElement("button", {
      position: "absolute",
      right: "-30px",
      top: "10px",
      width: "25px",
      height: "40px",
      background: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "0 5px 5px 0",
      cursor: "pointer",
      fontSize: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });
    toggleButton.innerHTML = "►";

    // 创建内容容器
    const contentContainer = DomHelper.createElement("div", {
      transition: "all 0.3s ease",
      overflow: "hidden",
    });

    // 创建用户名输入框
    const userNameInput = DomHelper.createElement(
      "input",
      {
        ...CONFIG.inputStyle,
        width: "300px",
        marginBottom: "5px",
        display: "block",
      },
      {
        type: "text",
        placeholder: "请输入用户名",
        value: Data.userName,
      }
    );

    // 创建URL输入框
    const urlInput = DomHelper.createElement(
      "input",
      {
        ...CONFIG.inputStyle,
        width: "300px",
        marginBottom: "5px",
        display: "block",
      },
      {
        type: "text",
        placeholder: "请输入url",
      }
    );

    // 创建transformUrl输入框
    const transformUrlInput = DomHelper.createElement(
      "input",
      {
        ...CONFIG.inputStyle,
        width: "300px",
        marginBottom: "5px",
        display: "block",
      },
      {
        type: "text",
        placeholder: "请输入transformUrl",
        value: Data.transformUrl,
      }
    );

    // 创建复选框容器
    const checkboxContainer = DomHelper.createElement("div", {
      ...CONFIG.checkboxContainerStyle,
      marginBottom: "5px",
    });

    // 创建复选框
    const checkbox = DomHelper.createElement("input", CONFIG.checkboxStyle, {
      type: "checkbox",
      id: "showThemeCheckbox",
      checked: Data.showTheme,
    });

    // 创建复选框标签
    const checkboxLabel = DomHelper.createElement(
      "label",
      CONFIG.checkboxLabelStyle
    );
    checkboxLabel.setAttribute("for", "showThemeCheckbox");
    checkboxLabel.textContent = "非人机";

    // 添加事件监听器
    userNameInput.addEventListener("input", (e) => {
      Data.userName = e.target.value.trim() || CONFIG.defaultName;
    });

    transformUrlInput.addEventListener("input", (e) => {
      Data.transformUrl = e.target.value.trim();
    });

    checkbox.addEventListener("change", (e) => {
      Data.showTheme = e.target.checked;
    });

    // 创建执行按钮
    const button = DomHelper.createElement("button", CONFIG.buttonStyle);
    button.textContent = "执行";

    button.addEventListener("click", async () => {
      const url = urlInput.value.trim();
      const transformUrl = transformUrlInput.value.trim();
      const userName = userNameInput.value.trim() || CONFIG.defaultName;

      Data.url = url || "";
      Data.transformUrl = transformUrl || "";
      Data.userName = userName;

      if (!url) {
        alert("请输入url");
        return;
      }
      if (!transformUrl) {
        alert("请输入transformUrl");
        return;
      }
      if (!userName) {
        alert("请输入userName");
        return;
      }

      // 保存到localStorage
      Storage.save("userName", userName);
      Storage.save("transformUrl", transformUrl);

      await BusinessLogic.updateConfig();
      urlInput.value = "";
    });

    // 折叠功能
    toggleButton.addEventListener("click", () => {
      Data.isCollapsed = !Data.isCollapsed;
      if (Data.isCollapsed) {
        contentContainer.style.width = "0";
        contentContainer.style.padding = "0";
        contentContainer.style.height = "0";
        toggleButton.innerHTML = "◄";
        container.style.width = "25px";
        container.style.padding = "0";
        container.style.border = "none";
        container.style.background = "transparent";
        container.style.boxShadow = "none";
      } else {
        contentContainer.style.width = "auto";
        contentContainer.style.padding = "0";
        contentContainer.style.height = "auto";
        toggleButton.innerHTML = "►";
        container.style.width = "auto";
        container.style.padding = "10px";
        container.style.border = "1px solid #ccc";
        container.style.background = "white";
        container.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
      }
    });

    // 组装UI元素
    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(checkboxLabel);

    contentContainer.appendChild(userNameInput);
    contentContainer.appendChild(urlInput);
    contentContainer.appendChild(transformUrlInput);
    contentContainer.appendChild(checkboxContainer);
    contentContainer.appendChild(button);

    container.appendChild(contentContainer);
    container.appendChild(toggleButton);
    document.body.appendChild(container);
  }

  // 主入口
  initUI();
})();
