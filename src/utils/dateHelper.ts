/**
 * ยูทิลิตีสำหรับการจัดการและการแปลงรูปแบบวันที่และเวลา
 * โครงการ ice-pos-web
 */

/**
 * แปลงสตริงวันที่ (เช่น "2026-10-28" จาก <input type="date"> หรือ ISO string)
 * ให้อยู่ในรูปแบบ RFC 3339 / ISO 8601 ("2006-01-02T15:04:05Z07:00")
 * ที่ Backend Golang time.Time JSON Unmarshaler รองรับ
 *
 * @param dateStr สตริงวันที่ที่ต้องการแปลง
 * @returns สตริงในรูปแบบ RFC 3339 เช่น "2026-10-28T00:00:00.000Z" หรือ undefined หากไม่มีค่า/แปลงไม่ได้
 */
export function formatToRFC3339(dateStr?: string | null): string | undefined {
  if (!dateStr || !dateStr.trim()) return undefined;

  try {
    const trimmed = dateStr.trim();

    // หากมีตัวแบ่งเวลา 'T' อยู่แล้ว ให้ตรวจสอบความถูกต้อง
    if (trimmed.includes('T')) {
      const d = new Date(trimmed);
      return !isNaN(d.getTime()) ? d.toISOString() : undefined;
    }

    // หากเป็นรูปแบบวันที่มาตรฐาน YYYY-MM-DD
    const d = new Date(`${trimmed}T00:00:00Z`);
    return !isNaN(d.getTime()) ? d.toISOString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * ฟอร์แมตวันที่สำหรับแสดงผลในตารางหรือ UI (dd/MM/yyyy)
 */
export function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
