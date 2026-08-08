# bilibili-dm-restore

Restore Bilibili's loaded-danmaku-count display, which was removed by Bilibili, via a userscript (Tampermonkey / Violentmonkey).

恢复 B 站视频播放器中被下掉的"已装填 N 条弹幕"数字显示，通过用户脚本（Tampermonkey / Violentmonkey）实现。

## Install

Install a userscript manager such as Tampermonkey (https://www.tampermonkey.net/) or Violentmonkey (https://violentmonkey.github.io/), then install `bilibili-dm-restore.user.js` from this repo, or from Greasyfork once published.

## How it works

Bilibili kept the DOM skeleton for the loaded-danmaku-count label but stopped populating the number. This script reads the actually-loaded danmaku array via `window.player.danmaku.getDanmakuX().manager.dataBase.dmArray` and writes the live count back into the label, refreshing continuously as more danmaku segments load.

## License

MIT
