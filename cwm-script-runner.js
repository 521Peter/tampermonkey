// ==UserScript==
// @name         cwm-srcipt-runner
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  try to take over the world!
// @author       You
// @match        https://cwm.gamegoing.com/strategy/meticulous/list
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @updateURL    https://raw.githubusercontent.com/521Peter/tampermonkey/refs/heads/master/cwm-script-runner.js?token=GHSAT0AAAAAADCYFBPSR3XH5AANYRBIIW6Y2BQCE7Q
// @downloadURL  https://raw.githubusercontent.com/521Peter/tampermonkey/refs/heads/master/cwm-script-runner.js?token=GHSAT0AAAAAADCYFBPSR3XH5AANYRBIIW6Y2BQCE7Q
// ==/UserScript==

(function () {
  "use strict";
  console.log("123");

  // 创建容器
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "20px";
  container.style.right = "20px";
  container.style.zIndex = "9999";
  container.style.padding = "10px";
  container.style.background = "white";
  container.style.border = "1px solid #ccc";
  container.style.borderRadius = "5px";
  container.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";

  // 创建输入框
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "请输入url";
  input.style.marginRight = "10px";
  input.style.padding = "5px";

  // 创建按钮
  const button = document.createElement("button");
  button.textContent = "执行";
  button.style.padding = "5px 10px";
  button.style.background = "#4CAF50";
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "3px";
  button.style.cursor = "pointer";

  // 按钮点击事件
  button.addEventListener("click", handleClick);

  function simulateInput(element, text) {
    element.value = text;

    // 触发相关事件
    const events = ["input", "change", "keydown", "keypress", "keyup"];
    events.forEach((eventType) => {
      const event = new Event(eventType, { bubbles: true });
      element.dispatchEvent(event);
    });

    return element;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function isSelectorUnique(selector) {
    const elements = document.querySelectorAll(selector);
    return elements.length === 1;
  }

  async function handleClick() {
    const url = input.value;
    if (!url) {
      alert("url不能为空");
      return;
    }

    // 获取名称输入框并模拟输入
    const nameInputs = document.querySelectorAll(
      '.ivu-input-wrapper > input[type="text"]'
    );
    if (nameInputs.length < 2) {
      alert("找不到名称输入框");
      return;
    }
    const nameInput = nameInputs[1];
    simulateInput(nameInput, "sdk_Test_ios_lgh");

    // 点击查询按钮
    const queryBtn = document.querySelector(
      ".ivu-form-item-content > .ivu-btn.ivu-btn-primary"
    );
    if (!queryBtn) {
      alert("找不到查询按钮");
      return;
    }
    queryBtn.click();

    await sleep(1200);

    // 检查结果是否唯一
    if (!isSelectorUnique(".table-tr")) {
      alert("搜索的内容不是唯一的");
      return;
    }

    // 查找并点击编辑按钮
    const editLinks = document.querySelectorAll(".operate-container a");
    const editBtn = Array.from(editLinks).find(
      (link) => link.textContent.trim() === "编辑"
    );
    if (!editBtn) {
      alert("找不到编辑按钮");
      return;
    }
    editBtn.click();

    await sleep(2000);

    // 点击下一步按钮
    const nextStepBtns = document.querySelectorAll(
      ".common-botfix-btn-container .ivu-btn.ivu-btn-primary"
    );
    if (nextStepBtns.length < 2) {
      alert("找不到下一步按钮");
      return;
    }
    nextStepBtns[0].click();
    nextStepBtns[1].click();

    document.querySelector(".ivu-icon-ios-expand").click();
    await sleep(800);

    // 获取并修改配置
    const textareas = [
      ...document.querySelectorAll(
        '.ivu-modal-body > .ivu-input-wrapper > textarea[wrap="soft"]'
      ),
    ];
    if (textareas.length < 2) {
      alert("找不到配置输入框");
      return;
    }
    const textareaInput = textareas[1];
    const configStr = textareaInput.value;
    if (!configStr) {
      alert("找不到配置");
      return;
    }

    try {
      const configObj = JSON.parse(configStr);
      configObj.urls[0].url = url;
      const fileName = new URL(url).hostname
        .replace("www.", "")
        .split(".")
        .join("-");
      configObj.urls[0].jsCode = `http://192.168.101.182:5500/dev/${fileName}.js`;
      simulateInput(textareaInput, JSON.stringify(configObj, null, 2));
      [
        ...document.querySelectorAll(
          ".ivu-modal-fullscreen .ivu-modal-footer .ivu-btn-primary"
        ),
      ][1].click();
    } catch (e) {
      alert("配置解析错误: " + e.message);
      return;
    }

    // 查找保存按钮
    const saveBtnSpans = document.querySelectorAll(
      ".common-botfix-btn-container button.ivu-btn-primary span"
    );
    const saveBtn = Array.from(saveBtnSpans).find(
      (span) => span.textContent.trim() === "保存"
    );
    if (!saveBtn) {
      alert("找不到保存按钮");
      return;
    }
    saveBtn.parentElement.click();

    // 查找返回按钮
    const defaultBtnSpans = document.querySelectorAll(
      ".common-botfix-btn-container .ivu-btn-default span"
    );
    const backBtn = Array.from(defaultBtnSpans).find(
      (span) => span.textContent.trim() === "返回"
    );
    if (!backBtn) {
      alert("找不到返回按钮");
      return;
    }
    backBtn.parentElement.click();
    input.value = "";
  }

  // 将元素添加到容器
  container.appendChild(input);
  container.appendChild(button);

  // 将容器添加到页面
  document.body.appendChild(container);
})();
