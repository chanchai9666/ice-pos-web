/**
 * ยูทิลิตีสังเคราะห์เสียงตอบรับสำหรับระบบ POS (Web Audio API Synthesizer)
 * โครงการ ice-pos-web
 *
 * ทำงานได้ 100% Offline และ Zero-latency โดยไม่ต้องโหลดไฟล์เสียง MP3 ภายนอก
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  // หากเบราว์เซอร์ระงับเสียงไว้เนื่องจากนโยบาย autoplay ให้สั่ง resume เมื่อมีการโต้ตอบ
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * เล่นเสียงดำเนินการสำเร็จ (Success Beep)
 * โทนเสียงสูง 880Hz (Sine Wave) สั้นสดใส ชัดเจน
 */
export function playSuccessBeep(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz (A5)

    // ปรับระดับเสียงและลดเสียงลงช่วงท้ายเพื่อป้องกันเสียงเปรี๊ยะ (Audio Click)
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (error) {
    console.warn('Audio playback error (Success Beep):', error);
  }
}

/**
 * เล่นเสียงดำเนินการไม่สำเร็จ / แจ้งเตือนข้อผิดพลาด (Error Buzzer)
 * โทนเสียงต่ำ 200Hz - 160Hz (Sawtooth Wave) เตือนชัดเจน แตกต่างจากเสียงสำเร็จ
 */
export function playErrorBuzzer(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.warn('Audio playback error (Error Buzzer):', error);
  }
}
