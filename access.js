(async function () {
  const form = document.querySelector("form");
  const message = document.querySelector("#message");
  const payload = document.querySelector("#payload");
  const decode = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
  const storageKey = "ag-research-key-" + payload.dataset.salt;
  async function unlock(raw) {
    const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt({name:"AES-GCM", iv:decode(payload.dataset.iv)}, key, decode(payload.textContent));
    try { sessionStorage.setItem(storageKey, btoa(String.fromCharCode(...raw))); } catch {}
    document.open();
    document.write(new TextDecoder().decode(plain));
    document.close();
    if (location.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView());
  }
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(form.elements.password.value), "PBKDF2", false, ["deriveBits"]);
      const raw = await crypto.subtle.deriveBits({name:"PBKDF2", hash:"SHA-256", salt:decode(payload.dataset.salt), iterations:600000}, material, 256);
      await unlock(new Uint8Array(raw));
    } catch {
      message.textContent = "كلمة السر غير صحيحة · Incorrect password";
      form.elements.password.select();
    } finally { button.disabled = false; }
  });
  try {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) await unlock(decode(saved));
  } catch { try { sessionStorage.removeItem(storageKey); } catch {} }
})();
