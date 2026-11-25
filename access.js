(async function () {
  const form = document.querySelector("form");
  const message = document.querySelector("#message");
  const payload = document.querySelector("#payload");
  const decode = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
  const storageKey = "ag-research-key-" + payload.dataset.salt;
  async function unlock(raw) {
    const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt({name:"AES-GCM", iv:decode(payload.dataset.iv)}, key, decode(payload.textContent));
    const page = new DOMParser().parseFromString(new TextDecoder().decode(plain), "text/html");
    const theme = page.querySelector('link[rel="stylesheet"]');
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = theme.href;
    stylesheet.media = "not all";
    await new Promise((resolve, reject) => {
      stylesheet.onload = resolve;
      stylesheet.onerror = () => {
        stylesheet.remove();
        reject(new Error("stylesheet"));
      };
      document.head.appendChild(stylesheet);
    });
    try { sessionStorage.setItem(storageKey, btoa(String.fromCharCode(...raw))); } catch {}
    document.title = page.title;
    document.documentElement.lang = page.documentElement.lang;
    document.documentElement.dir = page.documentElement.dir;
    document.querySelector('link[href="access.css"]').remove();
    stylesheet.media = "all";
    document.head.append(...page.head.querySelectorAll("style"));
    document.body.replaceWith(page.body);
    document.documentElement.classList.remove("restoring");
    if (location.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView());
  }
  const visibility = document.querySelector("#show-password");
  visibility?.addEventListener("change", () => {
    form.elements.password.type = visibility.checked ? "text" : "password";
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(form.elements.password.value), "PBKDF2", false, ["deriveBits"]);
      const raw = await crypto.subtle.deriveBits({name:"PBKDF2", hash:"SHA-256", salt:decode(payload.dataset.salt), iterations:600000}, material, 256);
      await unlock(new Uint8Array(raw));
    } catch (error) {
      message.textContent = error.message === "stylesheet" ? "تعذر تحميل التنسيق. حاول مجددا · Please retry" : "كلمة السر غير صحيحة · Incorrect password";
      form.elements.password.select();
    } finally { button.disabled = false; }
  });
  try {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) await unlock(decode(saved));
  } catch { try { sessionStorage.removeItem(storageKey); } catch {} }
  finally { document.documentElement.classList.remove("restoring"); }
})();
