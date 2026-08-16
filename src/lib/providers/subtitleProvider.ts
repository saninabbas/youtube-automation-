export interface SubtitleCue {
  index: number;
  startTimeSec: number;
  endTimeSec: number;
  text: string;
}

export interface SubtitleProvider {
  generateCues(scenes: Array<{ sceneIndex: number; estimatedDurationSec: number; subtitleText: string }>): SubtitleCue[];
  generateSrt(cues: SubtitleCue[]): string;
  generateVtt(cues: SubtitleCue[]): string;
}

class DefaultSubtitleProvider implements SubtitleProvider {
  generateCues(scenes: Array<{ sceneIndex: number; estimatedDurationSec: number; subtitleText: string }>): SubtitleCue[] {
    const cues: SubtitleCue[] = [];
    let currentTime = 0;
    let cueIndex = 1;

    for (const scene of scenes) {
      const sceneDuration = scene.estimatedDurationSec;
      const cleanText = scene.subtitleText.trim();

      // Split longer scene texts into readable subtitle blocks (max ~10-12 words per cue)
      const words = cleanText.split(/\s+/).filter(Boolean);
      if (words.length <= 12) {
        cues.push({
          index: cueIndex++,
          startTimeSec: currentTime,
          endTimeSec: currentTime + sceneDuration,
          text: cleanText,
        });
      } else {
        // Break into 2 or 3 smaller timed cues
        const chunks: string[] = [];
        const chunkSize = Math.ceil(words.length / Math.ceil(sceneDuration / 4));
        for (let i = 0; i < words.length; i += chunkSize) {
          chunks.push(words.slice(i, i + chunkSize).join(' '));
        }

        const durationPerChunk = sceneDuration / chunks.length;
        for (let j = 0; j < chunks.length; j++) {
          const start = currentTime + j * durationPerChunk;
          const end = start + durationPerChunk;
          cues.push({
            index: cueIndex++,
            startTimeSec: start,
            endTimeSec: end,
            text: chunks[j],
          });
        }
      }

      currentTime += sceneDuration;
    }

    return cues;
  }

  generateSrt(cues: SubtitleCue[]): string {
    return cues
      .map((cue) => {
        const startStr = this.formatSrtTime(cue.startTimeSec);
        const endStr = this.formatSrtTime(cue.endTimeSec);
        return `${cue.index}\n${startStr} --> ${endStr}\n${cue.text}\n`;
      })
      .join('\n');
  }

  generateVtt(cues: SubtitleCue[]): string {
    const header = 'WEBVTT\n\n';
    const body = cues
      .map((cue) => {
        const startStr = this.formatVttTime(cue.startTimeSec);
        const endStr = this.formatVttTime(cue.endTimeSec);
        return `${cue.index}\n${startStr} --> ${endStr}\n${cue.text}\n`;
      })
      .join('\n');
    return header + body;
  }

  private formatSrtTime(seconds: number): string {
    const totalMs = Math.floor(seconds * 1000);
    const hrs = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;

    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  private formatVttTime(seconds: number): string {
    const totalMs = Math.floor(seconds * 1000);
    const hrs = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;

    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }
}

export const subtitleProvider: SubtitleProvider = new DefaultSubtitleProvider();
