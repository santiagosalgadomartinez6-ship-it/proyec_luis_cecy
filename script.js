// Mente Libre — Interacción usuario-sistema y almacenamiento local (base de datos del navegador)

document.addEventListener("DOMContentLoaded", function () {
  initNav();
  initFooterYear();
  initQuiz();
  initSurveyForm();
  initContactForm();
  initHelpFloat();
  initHitCounter();
  initSparkleCursor();
});

/* ---------- Navegación ---------- */
function initNav() {
  var toggle = document.getElementById("navToggle");
  var navList = document.getElementById("navList");
  if (!toggle || !navList) return;

  toggle.addEventListener("click", function () {
    var isOpen = navList.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  navList.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navList.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initFooterYear() {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ---------- Quiz con retroalimentación instantánea ---------- */
function initQuiz() {
  var form = document.getElementById("quiz-form");
  if (!form) return;

  var CORRECTAS = { q1: "q1b", q2: "q2b", q3: "q3b", q4: "q4b" };
  var preguntas = Object.keys(CORRECTAS);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var sinResponder = preguntas.filter(function (nombre) {
      return !form.elements[nombre].value;
    });

    if (sinResponder.length) {
      alert("Por favor responde todas las preguntas antes de enviar.");
      return;
    }

    var aciertos = 0;

    preguntas.forEach(function (nombre) {
      var seleccionada = form.elements[nombre].value;
      form.querySelectorAll('input[name="' + nombre + '"]').forEach(function (input) {
        input.disabled = true;
        var opt = input.closest(".opt");
        if (input.id === CORRECTAS[nombre]) {
          opt.classList.add("correcto");
        } else if (input.id === seleccionada) {
          opt.classList.add("incorrecto");
        }
      });
      if (seleccionada === CORRECTAS[nombre]) aciertos++;
    });

    var resultado = document.getElementById("quiz-resultado");
    resultado.classList.remove("perfecto", "bien", "mal");
    resultado.classList.add("visible");
    document.getElementById("quiz-submit").disabled = true;

    if (aciertos === preguntas.length) {
      resultado.classList.add("perfecto");
      resultado.textContent = "¡Perfecto! " + aciertos + "/" + preguntas.length + " — ¡Estás muy bien informado/a! 🎉";
    } else if (aciertos >= preguntas.length / 2) {
      resultado.classList.add("bien");
      resultado.textContent = aciertos + "/" + preguntas.length + " correctas — ¡Buen intento! Sigue aprendiendo. 👍";
    } else {
      resultado.classList.add("mal");
      resultado.textContent = aciertos + "/" + preguntas.length + " correctas — Te recomendamos releer la sección de Información. 📚";
    }
  });
}

/* ---------- Encuesta anónima ----------
   Cada respuesta se guarda en localStorage (simula una base de
   datos ya que el sitio no cuenta con servidor propio) y los
   resultados se recalculan y grafican con barras animadas. */
var ENCUESTA_PREGUNTAS = [
  {
    campo: "informado",
    texto: "¿Qué tan informado te sientes sobre los riesgos de las adicciones?",
    opciones: ["Muy informado", "Algo informado", "Poco informado", "Nada informado"]
  },
  {
    campo: "hablar",
    texto: "¿Qué tan fácil te resultaría hablar con un adulto de confianza sobre este tema?",
    opciones: ["Muy fácil", "Algo fácil", "Difícil", "Muy difícil"]
  },
  {
    campo: "presion",
    texto: "¿Has sentido presión para probar alcohol, tabaco u otras sustancias?",
    opciones: ["Nunca", "Pocas veces", "Varias veces", "Muy seguido"]
  }
];

function initSurveyForm() {
  var form = document.getElementById("survey-form");
  if (!form) return;

  var clearBtn = document.getElementById("survey-clear");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var respuesta = { fecha: new Date().toISOString() };
    var valid = true;

    ENCUESTA_PREGUNTAS.forEach(function (pregunta) {
      var seleccionado = form.querySelector('input[name="' + pregunta.campo + '"]:checked');
      var row = document.getElementById("row-" + pregunta.campo);
      if (!seleccionado) {
        valid = false;
        if (row) row.classList.add("invalid");
      } else {
        if (row) row.classList.remove("invalid");
        respuesta[pregunta.campo] = seleccionado.value;
      }
    });

    if (!valid) return;

    var respuestas = JSON.parse(localStorage.getItem("mentelibre_encuesta") || "[]");
    respuestas.push(respuesta);
    localStorage.setItem("mentelibre_encuesta", JSON.stringify(respuestas));

    form.reset();
    renderSurveyResults();

    var successBox = document.getElementById("survey-success");
    if (successBox) successBox.classList.add("visible");
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (confirm("¿Borrar todas las respuestas guardadas en este dispositivo?")) {
        localStorage.removeItem("mentelibre_encuesta");
        renderSurveyResults();
        var successBox = document.getElementById("survey-success");
        if (successBox) successBox.classList.remove("visible");
      }
    });
  }

  renderSurveyResults();
}

function renderSurveyResults() {
  var container = document.getElementById("survey-results");
  if (!container) return;

  var respuestas = JSON.parse(localStorage.getItem("mentelibre_encuesta") || "[]");
  var total = respuestas.length;

  var totalLabel = document.getElementById("survey-total");
  if (totalLabel) {
    totalLabel.textContent = total === 1 ? "1 respuesta registrada" : total + " respuestas registradas";
  }

  var emptyMsg = document.getElementById("survey-empty");

  if (total === 0) {
    container.innerHTML = "";
    if (emptyMsg) emptyMsg.style.display = "block";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";

  var html = "";
  ENCUESTA_PREGUNTAS.forEach(function (pregunta) {
    html += '<div class="bar-question"><p style="font-size:0.85rem;font-weight:700;color:var(--dark);margin-bottom:8px;">' + pregunta.texto + "</p>";
    pregunta.opciones.forEach(function (opcion) {
      var count = respuestas.filter(function (r) { return r[pregunta.campo] === opcion; }).length;
      var pct = total > 0 ? Math.round((count / total) * 100) : 0;
      html +=
        '<div class="bar-item"><div class="bar-top"><span>' + opcion + "</span><span>" + count + " (" + pct + '%)</span></div>' +
        '<div class="bar-track"><div class="bar-fill" data-pct="' + pct + '"></div></div></div>';
    });
    html += "</div>";
  });

  container.innerHTML = html;

  requestAnimationFrame(function () {
    container.querySelectorAll(".bar-fill").forEach(function (fill) {
      fill.style.width = fill.getAttribute("data-pct") + "%";
    });
  });
}

/* ---------- Formulario de contacto ----------
   También se guarda en localStorage, ya que el sitio no
   cuenta con un servidor propio (es un proyecto escolar). */
function initContactForm() {
  var form = document.getElementById("contact-form");
  if (!form) return;

  var successBox = document.getElementById("contact-success");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var valid = true;

    var rows = {
      nombre: document.getElementById("row-nombre"),
      correo: document.getElementById("row-correo"),
      asunto: document.getElementById("row-asunto"),
      mensaje: document.getElementById("row-mensaje")
    };

    Object.keys(rows).forEach(function (key) {
      if (rows[key]) rows[key].classList.remove("invalid");
    });

    var nombre = form.nombre.value.trim();
    var correo = form.correo.value.trim();
    var asunto = form.asunto.value;
    var mensaje = form.mensaje.value.trim();

    if (nombre.length < 2) {
      rows.nombre.classList.add("invalid");
      valid = false;
    }

    var correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
    if (!correoValido) {
      rows.correo.classList.add("invalid");
      valid = false;
    }

    if (!asunto) {
      rows.asunto.classList.add("invalid");
      valid = false;
    }

    if (mensaje.length < 10) {
      rows.mensaje.classList.add("invalid");
      valid = false;
    }

    if (!valid) return;

    var registro = { nombre: nombre, correo: correo, asunto: asunto, mensaje: mensaje, fecha: new Date().toISOString() };

    var mensajes = JSON.parse(localStorage.getItem("mentelibre_mensajes") || "[]");
    mensajes.push(registro);
    localStorage.setItem("mentelibre_mensajes", JSON.stringify(mensajes));

    form.reset();
    form.style.display = "none";
    if (successBox) successBox.classList.add("visible");
  });
}

/* ---------- Botón flotante de ayuda ---------- */
function initHelpFloat() {
  var btn = document.getElementById("helpFloatBtn");
  var bubble = document.getElementById("helpBubble");
  if (!btn || !bubble) return;

  btn.addEventListener("click", function () {
    bubble.classList.toggle("visible");
  });
}

/* ---------- Contador de visitas (estilo "web 150 pesos") ---------- */
function initHitCounter() {
  var el = document.getElementById("hitCounter");
  if (!el) return;

  var visitas = parseInt(localStorage.getItem("mentelibre_visitas") || "0", 10) + 1;
  localStorage.setItem("mentelibre_visitas", String(visitas));
  el.textContent = String(visitas).padStart(6, "0");
}

/* ---------- Cursor con destellos ✨ ---------- */
function initSparkleCursor() {
  var emojis = ["✨", "🌟", "💫", "⭐"];
  var ultimo = 0;

  document.addEventListener("mousemove", function (e) {
    var ahora = Date.now();
    if (ahora - ultimo < 60) return;
    ultimo = ahora;

    var chispa = document.createElement("span");
    chispa.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    chispa.style.position = "fixed";
    chispa.style.left = e.clientX + "px";
    chispa.style.top = e.clientY + "px";
    chispa.style.pointerEvents = "none";
    chispa.style.fontSize = "1rem";
    chispa.style.zIndex = "2000";
    chispa.style.transition = "transform 0.6s ease, opacity 0.6s ease";
    document.body.appendChild(chispa);

    requestAnimationFrame(function () {
      chispa.style.transform = "translateY(-25px)";
      chispa.style.opacity = "0";
    });

    setTimeout(function () {
      chispa.remove();
    }, 650);
  });
}
