// ==UserScript==
// @name         Bilibili 弹幕装填数恢复
// @namespace    https://github.com/HeCPDF/bilibili-dm-restore
// @version      1.5
// @description  恢复B站视频播放器中被灰度下掉的「已装填xx条弹幕」功能显示
// @author       HeCPDF
// @match        *://www.bilibili.com/video/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==
(function() {
    'use strict';

    // 每隔多久强制刷新一次（毫秒）。弹幕是异步分段加载的，
    // 数字会从小逐渐涨到真实值，所以不能只在"第一次成功"时写一次就不管了。
    const POLL_MS = 1000;

    function getLoadedDmCount() {
        try {
            const dmX = window.player?.danmaku?.getDanmakuX();
            const arr = dmX?.manager?.dataBase?.dmArray;
            if (Array.isArray(arr)) {
                return arr.length;
            }
        } catch (e) {}
        return null;
    }

    function updateDmInfo() {
        try {
            const info = document.querySelector('.bpx-player-video-info');
            if (!info) return false;
            const onlineDiv = info.querySelector('.bpx-player-video-info-online');
            if (!onlineDiv) return false;
            const count = getLoadedDmCount();
            if (count === null) return false;

            // 分隔符 "，"
            let divideDiv = info.querySelector('.bpx-player-video-info-divide');
            if (!divideDiv) {
                divideDiv = document.createElement('div');
                divideDiv.className = 'bpx-player-video-info-divide';
                divideDiv.textContent = '，';
                onlineDiv.after(divideDiv);
            }

            // "已装填x条弹幕"（大多数情况下 B 站自己就渲染了这个骨架，
            // 只是从不写入真实数字；这里直接复用/补全它）
            let dmDiv = info.querySelector('.bpx-player-video-info-dm');
            if (!dmDiv) {
                dmDiv = document.createElement('div');
                dmDiv.className = 'bpx-player-video-info-dm';
                dmDiv.appendChild(document.createTextNode('已装填'));
                const dmNum = document.createElement('b');
                dmNum.className = 'bpx-player-video-info-dm-num';
                dmDiv.appendChild(dmNum);
                dmDiv.appendChild(document.createTextNode('条弹幕'));
                divideDiv.after(dmDiv);
            }

            let dmNum = dmDiv.querySelector('.bpx-player-video-info-dm-num');
            if (!dmNum) {
                // 兼容 B 站骨架里 num 节点用其它 tag/无 class 的情况
                dmNum = document.createElement('b');
                dmNum.className = 'bpx-player-video-info-dm-num';
                dmDiv.appendChild(dmNum);
            }
            const text = String(count);
            if (dmNum.textContent !== text) dmNum.textContent = text;
            return true;
        } catch (e) {
            return false;
        }
    }

    let started = false;
    function setupEventListeners() {
        if (started) return;
        started = true;

        const video = document.querySelector('video');
        if (video) {
            video.addEventListener('seeked', updateDmInfo, { passive: true });
            video.addEventListener('loadedmetadata', updateDmInfo, { passive: true });
        }

        // 弹幕是分段异步加载/解析的，数字会持续增长到真实值，
        // 所以用持续轮询代替"成功一次就 clearInterval"。
        setInterval(updateDmInfo, POLL_MS);

        // SPA 切集 / 换视频时，播放器和弹幕对象会被整个换掉，
        // 靠这个 observer 监听容器变化，重新挂 video 的事件监听。
        const observer = new MutationObserver(() => {
            const video2 = document.querySelector('video');
            if (video2 && video2 !== video) {
                video2.addEventListener('seeked', updateDmInfo, { passive: true });
                video2.addEventListener('loadedmetadata', updateDmInfo, { passive: true });
            }
            updateDmInfo();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function init() {
        updateDmInfo();
        setupEventListeners();

        // 初期播放器/弹幕对象可能还没就绪，短时间内加快轮询频率，
        // 直到拿到第一次非 null 的结果（不代表停止刷新，只是加速首次显示）。
        let retries = 0;
        const interval = setInterval(() => {
            updateDmInfo();
            retries++;
            if (retries >= 40) clearInterval(interval); // 最多轮询 20s
        }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
