<template>
  <div class="uploader-file" :status="progressingClass">
    <div
      class="uploader-file-progress"
      :class="progressingClass"
      :style="progressStyle"
    ></div>

    <div class="uploader-file-info">
      <div class="uploader-file-name">
        <i class="uploader-file-icon" :icon="fileCategory(file)"></i>
        {{ file.name }}
      </div>
      <div class="uploader-file-size">{{ formatSize(file.size) }}</div>
      <div class="uploader-file-status">
        <span v-show="progressingClass !== 'uploading'">
          {{ fileStatusText[progressingClass] }}</span
        >
        <span v-show="progressingClass === 'uploading'">
          <span>{{ progressStyle.text }}</span>
          <em>{{ formatedAverageSpeed(file) }}</em>
          <!-- <i>{{ formatedTimeRemaining }}</i> -->
        </span>
      </div>
      <div class="uploader-file-actions">
        <span class="uploader-file-pause" @click="pause"></span>
        <span class="uploader-file-resume" @click="resume"></span>
        <span class="uploader-file-retry" @click="retry"></span>
        <span class="uploader-file-remove" @click="remove"></span>
      </div>
    </div>
  </div>
</template>

<script>
import { utils } from "../utils.js";

export default {
  name: "XFile",
  mixins: [utils],
  props: {
    file: {
      type: Object,
      default() {
        return {};
      },
    },
  },
  data() {
    return {
      fileStatusText: {
        success: "上传成功",
        error: "上传失败",
        uploading: "上传中",
        paused: "已暂停",
        waiting: "等待上传",
      },

      progress: 0,
      paused: false,
      error: false,
      isComplete: false,
      isUploading: false,
    };
  },
  watch: {
    file: {
      handler(val) {
        this._actionCheck(val);
      },
      deep: true,
    },
  },
  computed: {
    progressStyle() {
      const progress = Math.floor(this.progress * 100);

      return {
        text: `${progress}%`,
        webkitTransform: `translateX(${Math.floor(progress - 100)}%)`,
        mozTransform: `translateX(${Math.floor(progress - 100)}%)`,
        msTransform: `translateX(${Math.floor(progress - 100)}%)`,
        transform: `translateX(${Math.floor(progress - 100)}%)`,
      };
    },
    progressingClass() {
      const isUploading = this.isUploading;
      const isComplete = this.isComplete;
      const isError = this.error;
      const paused = this.paused;
      if (isComplete) {
        return "success";
      } else if (isError) {
        return "error";
      } else if (isUploading) {
        return "uploading";
      } else if (paused) {
        return "paused";
      } else {
        return "waiting";
      }
    },
  },
  methods: {
    _actionCheck() {
      this.progress = this.file.progress();
      this.paused = this.file.paused;
      this.error = this.file.error;
      this.isComplete = this.file.completed;
      this.isUploading = this.file.isUploading();
    },
    fileCategory(file) {
      let type = "unknown";
      const extension = file.name
        .slice(file.name.lastIndexOf(".") + 1)
        .toLowerCase();
      const typeMap = {
        image: ["gif", "jpg", "jpeg", "png", "bmp", "webp"],
        video: ["mp4", "m3u8", "rmvb", "avi", "swf", "3gp", "mkv", "flv"],
        audio: ["mp3", "wav", "wma", "ogg", "aac", "flac"],
        document: [
          "doc",
          "txt",
          "docx",
          "pages",
          "epub",
          "pdf",
          "numbers",
          "csv",
          "xls",
          "xlsx",
          "keynote",
          "ppt",
          "pptx",
        ],
      };

      Object.keys(typeMap).forEach((_type) => {
        const extensions = typeMap[_type];
        if (extensions.indexOf(extension) > -1) {
          type = _type;
        }
      });
      return type;
    },

    formatedAverageSpeed(file) {
      return `${this.formatSize(file.averageSpeed)} / s`;
    },

    // 暂停
    pause() {
      this.file.pause();
      this._actionCheck();
      //   this._fileProgress();
    },

    // 恢复
    resume() {
      this.file.resume();
      this._actionCheck();
    },

    // 删除
    remove() {
      this.file.cancel();
    },

    // 重试
    retry() {
      this.file.retry();
      this._actionCheck();
    },
  },
};
</script>

<style scoped>
.uploader-file {
  position: relative;
  height: 49px;
  line-height: 49px;
  overflow: hidden;
  border-bottom: 1px solid #cdcdcd;
}

.uploader-file[status="waiting"] .uploader-file-pause,
.uploader-file[status="uploading"] .uploader-file-pause {
  display: block;
}

.uploader-file[status="paused"] .uploader-file-resume {
  display: block;
}

.uploader-file[status="error"] .uploader-file-retry {
  display: block;
}

.uploader-file[status="success"] .uploader-file-remove {
  display: none;
}

.uploader-file[status="error"],
.uploader-file[status="error"] .uploader-file-progress {
  background: #ffe0e0;
}

.uploader-file-progress {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #e2eeff;
  transform: translateX(-100%);
}

.uploader-file-info {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow: hidden;
}

.uploader-file-info:hover {
  background-color: rgba(240, 240, 240, 0.2);
}

.uploader-file-name,
.uploader-file-size,
.uploader-file-meta,
.uploader-file-status,
.uploader-file-actions {
  float: left;
  position: relative;
  height: 100%;
}

.uploader-file-name {
  width: 45%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-indent: 14px;
}

.uploader-file-icon {
  width: 24px;
  height: 24px;
  display: inline-block;
  vertical-align: top;
  margin-top: 13px;
  margin-right: 8px;
}

.uploader-file-icon::before {
  content: "📃";
  display: block;
  height: 100%;
  font-size: 24px;
  line-height: 1;
  text-indent: 0;
}

.uploader-file-icon[icon="folder"]::before {
  content: "📂";
}

.uploader-file-icon[icon="image"]::before {
  content: "📊";
}

.uploader-file-icon[icon="video"]::before {
  content: "📹";
}

.uploader-file-icon[icon="audio"]::before {
  content: "🎵";
}

.uploader-file-icon[icon="document"]::before {
  content: "📋";
}

.uploader-file-size {
  width: 13%;
  text-indent: 10px;
}

.uploader-file-meta {
  width: 8%;
}

.uploader-file-status {
  width: 32%;
  text-indent: 20px;
}

.uploader-file-actions {
  width: 10%;
}

.uploader-file-actions > span {
  display: none;
  float: left;
  width: 16px;
  height: 16px;
  margin-top: 16px;
  margin-right: 6px;
  cursor: pointer;
  background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAABkCAYAAAD0ZHJ6AAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAJcEhZcwAACxMAAAsTAQCanBgAAARkSURBVGje7ZnfS1NRHMAH4ptPkvQSuAdBkCxD8FUQJMEULUgzy1KyyPVQ4JMiiP4Bvg6EwUQQfMmwhwRDshwaKUjDVCgoSdDNHkzTJZ6+Z37Purve8+PeTb2TM/ggu+ew89l33x8H9BBCPG7GowXTJej3+wnDvEm0JuLC04+EYWftVAUv+fiCvDUdQR1BHUEdQR3BTIygvixoQS14XgTtthLVdpNWwXRLqvQ724LplFRtyrYF0yVpFLQrKRVMh6RZ0I6kkmCqklaCqpKZH0FX56Crq9jVfdDVk0RfFrSgFsxkQVmLcdKCVrKySCrryhPEyYShhzOcrFtG0EoilfHHk1CRU5rF6ZjNZhlVOW6RnMSVyyilKies4pO41diVy8wIujoHXV3FGdMHXTtJKLFYTLhZtq4vC1rwXApCZTIqgR6g1PBMCO9DL3bMMSqBHqDU8EyISDAHiGKvWwcCQG2KgjlAFCDAOhAAap0K5gKLphk8mqJgLrCIgoxRJ4J5wKpJ7gAoMkn5EBXBPGDVJHcAFJmkfIhQcAql1oBpTvTol9gG9pm4RHAKpdaAaU706JfYBvaZuJVgPQrt4sFlnOh5MC/p3lmJYD0K7eLBZZzoeTAv6d5ZnuAYHjpgEOnk5F0ufhG6v1ggOIaHDhhEOjl5l4tfhO4vthLcwAMrFNvLJO5vEwhu4IEViu1lEve3WQmyoihQFBzG/V0CQVYUBYqCw7i/SxTBcpsRbFeIYLnNCLZbCY5b5KAnxRwct8hBj9McZFVMW0ihRNBuFdMWUigRlFaxuQ9WWYjRMTiIe5z0wSoLMToGB3GPsA9aTZIJoB+nRgBnM1tzOkkmgH6cGgGczWzNpzqLx3n/aULJJgezeNw07oxQySbVywKjBOgFRnDs+VEsx8FlgVEC9AIjOPb8KJYjvSzoG7UW1IJaUAtqQS14toLNM5fN5APdwBJA8G83Pk/aK/rgzVvXzeQD3cASQPBvNz5P2ssTzAaGUIrHEO6zI5gNDKEUjyHcxxWkh4Ylcowwk1QQpIeGJXKMMJO0EgwqyjGCioJBJvDrxRMSuVOTJEXfbz1/bHwWtBL0yoQehK6RucgE+bGzanzulQh6E3IgQV+xpc8kcrfuSO7eTfJ3ZYmQw0Oy9azVKOk1C/bJ5D5F38YPeLfx0rjWJxHsS0SqsSYuxySjj5qO5Oj7xQWy2VBtFOwzCy6ryH3YfE3uh64Y1xckgstJPydEjkkeHv07Iy4Xaao15+KCWTBx6M/db+T9xivSErqaJDdzXI6yLRE8Vgg0coex/SPJvT0SbWu0KpZtbgSpCH3NRt7I5OxHkObc6heU+/M/J5vrpBFM5GBLqCQux14COXs5CNXK5OjPGm1tSMrJSOMNYQ4mVTGV/L6zTL7+DovkbFUxbSW0Wo05l8hJWsU+cRWfSh+Mt5Lb1ck/J1TvVsdDaR/MiEni+llsdZuZp62EViu+96bpNjNPWwmtVnzvFd5m9IVVC54x/wA7gNvqFG9vXQAAAABJRU5ErkJggg==")
    no-repeat 0 0;
}

.uploader-file-actions > span:hover {
  background-position-x: -21px;
}

.uploader-file-actions .uploader-file-pause {
  background-position-y: 0;
}

.uploader-file-actions .uploader-file-resume {
  background-position-y: -17px;
}

.uploader-file-actions .uploader-file-retry {
  background-position-y: -53px;
}

.uploader-file-actions .uploader-file-remove {
  display: block;
  background-position-y: -34px;
}
</style>
