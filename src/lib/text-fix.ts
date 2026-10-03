// lib/text-fix.ts
// ⭐ পার্মানেন্ট বাংলা ও ইংরেজি এনকোডিং ফিক্সার (Mojibake Auto-Repair)

export function fixBanglaEncoding(text: any): string {
  if (!text || typeof text !== "string") return text || "";

  // যদি টেক্সট স্বাভাবিক থাকে এবং কোনো Mojibake লক্ষণ না থাকে, সরাসরি রিটার্ন করবে
  if (!text.includes("à¦") && !text.includes("à§") && !text.includes("â€")) {
    return text;
  }

  try {
    // Mojibake বাইট ডিকোড করে আসল UTF-8 ইউনিকোডে ফিরিয়ে আনা
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      bytes[i] = text.charCodeAt(i) & 0xff;
    }
    const decoded = new TextDecoder("utf-8").decode(bytes);

    // ডিকোড করার পর যদি সঠিক বাংলা অক্ষর পাওয়া যায়, তবে সেটি রিটার্ন করবে
    if (/[\u0980-\u09FF]/.test(decoded)) {
      return decoded;
    }
  } catch (err) {
    // কোনো কারণে ব্যর্থ হলে মূল টেক্সট থাকবে
  }

  return text;
}