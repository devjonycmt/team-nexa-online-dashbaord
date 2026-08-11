// ==========================================
// Supabase Configuration
const SUPABASE_URL = "https://wbavkbrkncsezwozdhat.supabase.co";
const SUPABASE_KEY = "sb_publishable_srEIHOqwXyOrQ3rNMrMZGQ_d_U6_YZY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

window.onload = function () {
  if (localStorage.getItem("isAdminLoggedIn") === "true") {
    showDashboard();
  }
};

function handleLogin() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const errorDiv = document.getElementById("loginError");

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    localStorage.setItem("isAdminLoggedIn", "true");
    showDashboard();
  } else {
    errorDiv.textContent = "Invalid username or password!";
    errorDiv.classList.remove("hidden");
    showToast("Invalid username or password!", "error");
  }
}

function handleLogout() {
  localStorage.removeItem("isAdminLoggedIn");
  document.getElementById("dashboardSection").classList.add("hidden");
  document.getElementById("loginSection").classList.remove("hidden");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  showToast("Logged out successfully!", "info");
}

function showDashboard() {
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("dashboardSection").classList.remove("hidden");

  const todayStr = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("filterDate");
  if (!dateInput.value) {
    dateInput.value = todayStr;
  }

  // --- এখানে কোডটুকু যোগ করুন ---
  const opDateInput = document.getElementById("opFilterDate");
  if (opDateInput && !opDateInput.value) {
    opDateInput.value = todayStr;
  }
  // -----------------------------

  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  };
  const formattedToday = new Date().toLocaleDateString("en-US", options);
  document.getElementById("currentDateDisplay").textContent =
    `Today: ${formattedToday}`;

  fetchMemberData();
}

function switchTab(tabName) {
  const dashboardTab = document.getElementById("tab-dashboard");
  const membersTab = document.getElementById("tab-members");
  const onlinePaymentsTab = document.getElementById("tab-online-payments");

  const navDashboard = document.getElementById("nav-dashboard");
  const navMembers = document.getElementById("nav-members");
  const navOnlinePayments = document.getElementById("nav-online-payments");
  const pageTitle = document.getElementById("pageTitle");

  if (dashboardTab) dashboardTab.classList.add("hidden");
  if (membersTab) membersTab.classList.add("hidden");
  if (onlinePaymentsTab) onlinePaymentsTab.classList.add("hidden");

  const defaultNavClass =
    "w-full text-left px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white font-medium transition cursor-pointer";
  const activeNavClass =
    "w-full text-left px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium transition cursor-pointer";

  if (navDashboard) navDashboard.className = defaultNavClass;
  if (navMembers) navMembers.className = defaultNavClass;
  if (navOnlinePayments) navOnlinePayments.className = defaultNavClass;

  if (tabName === "dashboard" && dashboardTab) {
    dashboardTab.classList.remove("hidden");
    if (navDashboard) navDashboard.className = activeNavClass;
    if (pageTitle) pageTitle.textContent = "Dashboard";
  } else if (tabName === "members" && membersTab) {
    membersTab.classList.remove("hidden");
    if (navMembers) navMembers.className = activeNavClass;
    if (pageTitle) pageTitle.textContent = "Member Accounts";
    if (typeof fetchMemberData === "function") fetchMemberData();
  } else if (tabName === "online-payments" && onlinePaymentsTab) {
    onlinePaymentsTab.classList.remove("hidden");
    if (navOnlinePayments) navOnlinePayments.className = activeNavClass;
    if (pageTitle) pageTitle.textContent = "Online Payments Gateway";
    if (typeof fetchOnlinePaymentData === "function") fetchOnlinePaymentData();
  }
}

// ==========================================
// VIEW WORK REPORTS & HISTORY MODAL
// ==========================================
let currentModalReports = [];
let activeModalDate = "";

async function openViewModal(userId, userName) {
  const modal = document.getElementById("viewModal");
  const container = document.getElementById("viewModalContainer");
  const modalBody = document.getElementById("viewModalBodyContent");
  document.getElementById("viewModalMemberName").textContent =
    `Work History: ${userName}`;

  modalBody.innerHTML = `<div class="text-center py-6 text-slate-400 font-medium">Loading reports history...</div>`;
  modal.classList.remove("hidden");
  setTimeout(() => {
    container.classList.remove("scale-95", "opacity-0");
    container.classList.add("scale-100", "opacity-100");
  }, 10);

  try {
    const { data: reports, error } = await supabaseClient
      .from("work_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    currentModalReports = reports || [];
    activeModalDate = "";
    renderModalContent();
  } catch (err) {
    modalBody.innerHTML = `<div class="text-center py-6 text-rose-500 font-medium">Error loading history: ${err.message}</div>`;
    showToast("Error loading history: " + err.message, "error");
  }
}

function filterModalDate(dateVal) {
  activeModalDate = dateVal;
  renderModalContent();
}

function copyTextToClipboard(text, buttonElement) {
  navigator.clipboard.writeText(text).then(() => {
    const originalHTML = buttonElement.innerHTML;
    buttonElement.innerHTML = `<span class="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">Copied!</span>`;
    showToast("Copied to clipboard!", "success");
    setTimeout(() => {
      buttonElement.innerHTML = originalHTML;
    }, 1500);
  });
}

function renderModalContent() {
  const modalBody = document.getElementById("viewModalBodyContent");

  if (!currentModalReports || currentModalReports.length === 0) {
    modalBody.innerHTML = `<div class="text-center py-6 text-slate-400 font-medium">No work reports found for this user.</div>`;
    return;
  }

  const filtered = currentModalReports.filter((rep) => {
    const workName = (rep.work_name || "").toLowerCase();
    let matchesCategory =
      workName.includes("meta") ||
      workName.includes("ai") ||
      workName.includes("metai") ||
      workName === "";

    let matchesDate = true;
    if (activeModalDate && rep.created_at) {
      const repDate = new Date(rep.created_at).toISOString().split("T")[0];
      matchesDate = repDate === activeModalDate;
    }
    return matchesCategory && matchesDate;
  });

  let html = `
    <div class="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
      <span class="text-xs font-bold text-slate-600 uppercase">Meta AI Reports</span>
      <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
        <span class="text-[11px] font-bold text-slate-500 uppercase">Date:</span>
        <input type="date" value="${activeModalDate}" onchange="filterModalDate(this.value)" class="text-xs font-semibold bg-transparent text-slate-700 focus:outline-none cursor-pointer">
        ${activeModalDate ? `<button onclick="filterModalDate('')" class="text-xs text-rose-600 font-bold hover:underline ml-1">Reset</button>` : ""}
      </div>
    </div>
  `;

  if (filtered.length === 0) {
    html += `<div class="text-center py-6 text-slate-400 font-medium">No Meta AI reports found.</div>`;
    modalBody.innerHTML = html;
    return;
  }

  html += `
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
            <th class="py-3 px-3">#</th>
            <th class="py-3 px-3">Work Name</th>
            <th class="py-3 px-3">Account / Username / Mail</th>
            <th class="py-3 px-3">Status</th>
            <th class="py-3 px-3">Date & Time</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm text-slate-700">
  `;

  filtered.forEach((rep, index) => {
    let formattedDate = rep.created_at
      ? new Date(rep.created_at).toLocaleString()
      : "N/A";
    let accountUsernameMail = "N/A";

    let repStatus = (rep.good_count || "pending").toLowerCase();

    for (let key in rep) {
      if (
        ![
          "id",
          "user_id",
          "created_at",
          "updated_at",
          "work_name",
          "category",
          "good_count",
          "account_stock",
          "stock_user",
          "uid",
          "worker_id",
          "two_fa",
          "cookies",
          "full_name",
        ].includes(key)
      ) {
        let val = rep[key];
        if (
          val &&
          typeof val === "string" &&
          (val.includes("@") || val.length > 3)
        ) {
          let lowerKey = key.toLowerCase();
          if (
            lowerKey.includes("mail") ||
            lowerKey.includes("email") ||
            lowerKey.includes("account") ||
            lowerKey.includes("username") ||
            lowerKey.includes("meta") ||
            val.includes("@")
          ) {
            accountUsernameMail = val;
            break;
          }
        }
      }
    }

    if (accountUsernameMail === "N/A") {
      for (let key in rep) {
        if (
          ![
            "id",
            "user_id",
            "created_at",
            "updated_at",
            "work_name",
            "category",
            "good_count",
            "full_name",
            "status",
          ].includes(key)
        ) {
          let val = rep[key];
          if (val && typeof val === "string" && val.trim() !== "") {
            accountUsernameMail = val;
            break;
          }
        }
      }
    }

    let accountCellHtml =
      accountUsernameMail !== "N/A"
        ? `<div class="flex items-center justify-between gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
           <span class="font-bold text-slate-800 text-xs">${accountUsernameMail}</span>
           <button onclick="copyTextToClipboard('${accountUsernameMail.replace(/'/g, "\\'")}', this)" class="p-1 text-slate-400 hover:text-indigo-600 bg-white border rounded">Copy</button>
         </div>`
        : `<span class="text-slate-400 italic">N/A</span>`;

    let statusBadge = "";
    if (repStatus === "success" || repStatus === "good") {
      statusBadge = `<span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-extrabold border border-emerald-200">Success</span>`;
    } else if (repStatus === "cancel" || repStatus === "bad") {
      statusBadge = `<span class="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[11px] font-extrabold border border-rose-200">Bad (Cancel)</span>`;
    } else {
      statusBadge = `<span class="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[11px] font-extrabold border border-amber-200">Pending</span>`;
    }

    html += `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-3 font-bold text-slate-400">${index + 1}</td>
        <td class="py-3 px-3 font-extrabold text-purple-700">${rep.work_name || "Meta AI"}</td>
        <td class="py-3 px-3">${accountCellHtml}</td>
        <td class="py-3 px-3">${statusBadge}</td>
        <td class="py-3 px-3 text-xs text-slate-600">${formattedDate}</td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  modalBody.innerHTML = html;
}

function closeViewModal() {
  const modal = document.getElementById("viewModal");
  const container = document.getElementById("viewModalContainer");
  container.classList.remove("scale-100", "opacity-100");
  container.classList.add("scale-95", "opacity-0");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 200);
}

// ==========================================
// ONLINE PAYMENTS FETCH & MANAGEMENT
// ==========================================
async function fetchOnlinePaymentData() {
  const tableBody = document.getElementById("onlinePaymentTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `<tr><td colspan="9" class="py-6 text-center text-slate-400 font-medium">Loading online payments...</td></tr>`;

  const opFilterDate = document.getElementById("opFilterDate");
  const selectedDate = opFilterDate ? opFilterDate.value : "";

  try {
    let query = supabaseClient
      .from("online_payments")
      .select("*")
      .order("date", { ascending: false });

    // যদি তারিখ সিলেক্ট করা থাকে তবে ডেট অনুযায়ী ফিল্টার হবে
    if (selectedDate) {
      query = query.eq("date", selectedDate);
    }

    const { data: payments, error: paymentError } = await query;
    if (paymentError) throw paymentError;

    const { data: users, error: userError } = await supabaseClient
      .from("users")
      .select("*");
    if (userError) throw userError;

    renderOnlinePaymentTable(payments, users);
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="9" class="py-6 text-center text-rose-500 font-medium">Error: ${err.message}</td></tr>`;
    showToast("Error: " + err.message, "error");
  }
}

function renderOnlinePaymentTable(payments, users) {
  const tableBody = document.getElementById("onlinePaymentTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (!payments || payments.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="9" class="py-6 text-center text-slate-400 font-medium">No records found for this date.</td></tr>`;
    document.getElementById("opTotalSuccessAmount").textContent = "৳0.00";
    document.getElementById("opTotalPendingAmount").textContent = "৳0.00";
    document.getElementById("opSuccessCount").textContent = "0";
    return;
  }

  let totalSuccessAmount = 0;
  let totalPendingAmount = 0;
  let successCount = 0;

  payments.forEach((payment) => {
    const amount = parseFloat(payment.amount || 0);
    if ((payment.status || "").toLowerCase() === "success") {
      totalSuccessAmount += amount;
      successCount++;
    } else {
      totalPendingAmount += amount;
    }
  });

  document.getElementById("opTotalSuccessAmount").textContent =
    `৳${totalSuccessAmount.toFixed(2)}`;
  document.getElementById("opTotalPendingAmount").textContent =
    `৳${totalPendingAmount.toFixed(2)}`;
  document.getElementById("opSuccessCount").textContent = successCount;

  payments.forEach((payment, index) => {
    const user = users.find((u) => u.id === payment.user_id) || {};
    const userName = user.full_name || user.username || "Unknown User";
    const rowBg = index % 2 === 0 ? "bg-white" : "bg-slate-50/80";

    const transactionNumberText = payment.transaction_number
      ? payment.transaction_number
      : "-";

    let statusBadge =
      payment.status.toLowerCase() === "success"
        ? `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-extrabold">Success</span>`
        : `<span class="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-extrabold">Pending</span>`;

    let actionBtn =
      payment.status.toLowerCase() === "success"
        ? `<button onclick="revertOnlinePayment('${payment.id}')" class="px-3 py-1.5 bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white rounded-xl text-xs font-extrabold transition cursor-pointer">Revert</button>`
        : `<button onclick="confirmOnlinePayment('${payment.id}')" class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl text-xs font-extrabold transition cursor-pointer">Confirm Pay</button>`;

    tableBody.innerHTML += `
      <tr class="${rowBg} border-b border-slate-100">
        <td class="py-4 px-4 font-bold text-slate-800">${userName}</td>
        <td class="py-4 px-4 text-slate-600 uppercase font-semibold">${payment.gateway || "N/A"}</td>
        <td class="py-4 px-4 text-slate-600 font-semibold">${payment.payment_number || "N/A"}</td>
        <td class="py-4 px-4"><span class="text-xs font-extrabold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl">${payment.work_details || "N/A"}</span></td>
        <td class="py-4 px-4 font-extrabold text-emerald-600">৳${parseFloat(payment.amount || 0).toFixed(2)}</td>
        <td class="py-4 px-4 text-slate-600 text-sm">${payment.date}</td>
        <td class="py-4 px-4">${statusBadge}</td>
        <td class="py-4 px-4 font-bold text-slate-700">${transactionNumberText}</td>
        <td class="py-4 px-4 text-center">${actionBtn}</td>
      </tr>`;
  });
}

async function revertOnlinePayment(paymentId) {
  try {
    const { error } = await supabaseClient
      .from("online_payments")
      .update({ status: "pending" })
      .eq("id", paymentId);
    if (error) throw error;
    showToast("Payment reverted to pending successfully!", "success");
    fetchOnlinePaymentData();
    if (typeof fetchMemberData === "function") fetchMemberData();
  } catch (err) {
    showToast("Failed to revert payment: " + err.message, "error");
  }
}

async function revertOnlinePayment(paymentId) {
  try {
    const { error } = await supabaseClient
      .from("online_payments")
      .update({ status: "pending" })
      .eq("id", paymentId);
    if (error) throw error;
    showToast("Payment reverted to pending successfully!", "success");
    fetchOnlinePaymentData();
    if (typeof fetchMemberData === "function") fetchMemberData();
  } catch (err) {
    showToast("Failed to revert payment: " + err.message, "error");
  }
}

let activePaymentIdToConfirm = null;
function handlePaySelectChange(val) {
  if (val) {
    document.getElementById("modalPayInput").value = val;
    localStorage.setItem("lastUsedPayNumber", val);
  }
}

function confirmOnlinePayment(paymentId) {
  activePaymentIdToConfirm = paymentId;
  const modal = document.getElementById("customPayModal");
  document.getElementById("modalPayInput").value =
    localStorage.getItem("lastUsedPayNumber") || "";
  modal.classList.remove("hidden");
}

function closeCustomPayModal() {
  document.getElementById("customPayModal").classList.add("hidden");
  activePaymentIdToConfirm = null;
}

document.addEventListener("DOMContentLoaded", () => {
  const confirmBtn = document.getElementById("modalConfirmBtn");
  if (confirmBtn) {
    confirmBtn.onclick = async function () {
      const finalTransactionNumber = document
        .getElementById("modalPayInput")
        .value.trim();
      if (!finalTransactionNumber) {
        showToast("Please enter or select a transaction number!", "error");
        return;
      }
      try {
        const { error } = await supabaseClient
          .from("online_payments")
          .update({
            status: "Success",
            transaction_number: finalTransactionNumber,
            // payment_number এখানে বাদ দেওয়া হলো, ফলে মেম্বারদের আসল পেমেন্ট নম্বর অপরিবর্তিত থাকবে
          })
          .eq("id", activePaymentIdToConfirm);

        if (error) throw error;
        localStorage.setItem("lastUsedPayNumber", finalTransactionNumber);
        closeCustomPayModal();
        showToast("Payment confirmed successfully!", "success");
        fetchOnlinePaymentData();
        if (typeof fetchMemberData === "function") fetchMemberData();
      } catch (err) {
        showToast("Failed to confirm payment: " + err.message, "error");
      }
    };
  }
});

// ==========================================
// MEMBER AUDIT & META RATE CALCULATION
// ==========================================
let currentSelectedUserId = null;

async function handleAction(userId) {
  currentSelectedUserId = userId;
  const selectedDate =
    document.getElementById("filterDate").value ||
    new Date().toISOString().split("T")[0];

  try {
    const { data: user, error: userError } = await supabaseClient
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (userError) throw userError;

    const { data: reports, error: reportError } = await supabaseClient
      .from("work_reports")
      .select("*")
      .eq("user_id", userId);
    if (reportError) throw reportError;

    const filteredReports = reports.filter((report) => {
      if (!report.created_at) return false;
      const d = new Date(report.created_at);
      const reportDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return reportDate === selectedDate;
    });

    let metaTotal = 0;
    let metaGood = 0;
    let metaBad = 0;
    let metaPending = 0;

    filteredReports.forEach((report) => {
      const workName = (report.work_name || "").toLowerCase();
      if (
        workName.includes("meta") ||
        workName.includes("ai") ||
        workName.includes("metai") ||
        workName === ""
      ) {
        metaTotal++;
        const st = (report.good_count || "pending").toLowerCase();
        if (st === "success" || st === "good") metaGood++;
        else if (st === "cancel" || st === "bad") metaBad++;
        else metaPending++;
      }
    });

    document.getElementById("modalMemberName").textContent =
      `Audit for: ${user.full_name || user.username}`;

    const modalBody = document.getElementById("modalBodyContent");
    modalBody.innerHTML = `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="w-full md:w-1/4">
            <span class="text-xs font-bold text-purple-700 uppercase tracking-wider block">Meta AI</span>
            <span class="text-sm font-extrabold text-slate-800">Total: ${metaTotal}</span>
          </div>
          <div class="w-full md:w-1/4">
            <span class="text-[11px] font-bold text-emerald-600 block mb-1">Good (Success)</span>
            <span class="text-base font-extrabold text-emerald-600">${metaGood}</span>
          </div>
          <div class="w-full md:w-1/4">
            <span class="text-[11px] font-bold text-rose-600 block mb-1">Bad (Cancel)</span>
            <span class="text-base font-extrabold text-rose-600">${metaBad}</span>
          </div>
          <div class="w-full md:w-1/4 text-right">
            <span class="text-[11px] font-bold text-amber-600 block mb-1">Pending</span>
            <span class="text-base font-extrabold text-amber-600">${metaPending}</span>
          </div>
        </div>
      </div>
    `;

    const modal = document.getElementById("actionModal");
    const container = document.getElementById("modalContainer");
    modal.classList.remove("hidden");
    setTimeout(() => {
      container.classList.remove("scale-95", "opacity-0");
      container.classList.add("scale-100", "opacity-100");
    }, 10);
  } catch (error) {
    showToast("Could not load user audit data.", "error");
  }
}

function closeModal() {
  const modal = document.getElementById("actionModal");
  const container = document.getElementById("modalContainer");
  container.classList.remove("scale-100", "opacity-100");
  container.classList.add("scale-95", "opacity-0");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 200);
}

function calculateMetaPay(count) {
  if (count >= 1000) return count * 2.0;
  if (count >= 300) return count * 1.5;
  if (count >= 100) return count * 1.2;
  return count * 1.0;
}

async function fetchMemberData() {
  const selectedDate =
    document.getElementById("filterDate").value ||
    new Date().toISOString().split("T")[0];
  const tableBody = document.getElementById("memberTableBody");
  tableBody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 font-medium">Loading reports...</td></tr>`;

  try {
    const { data: users, error: userError } = await supabaseClient
      .from("users")
      .select("*");
    if (userError) throw userError;

    let reports = [];
    let rangeStep = 1000;
    let from = 0;
    let keepFetching = true;

    while (keepFetching) {
      const { data: chunk, error: reportError } = await supabaseClient
        .from("work_reports")
        .select("*")
        .range(from, from + rangeStep - 1);

      if (reportError) throw reportError;

      if (chunk && chunk.length > 0) {
        reports = reports.concat(chunk);
        if (chunk.length < rangeStep) {
          keepFetching = false;
        } else {
          from += rangeStep;
        }
      } else {
        keepFetching = false;
      }
    }

    const { data: payments, error: paymentError } = await supabaseClient
      .from("online_payments")
      .select("*")
      .eq("date", selectedDate);
    if (paymentError) console.warn("Payment fetch note:", paymentError.message);

    const filteredReports = reports
      ? reports.filter((report) => {
          if (!report.created_at) return false;
          const d = new Date(report.created_at);
          const reportDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return reportDate === selectedDate;
        })
      : [];

    let memberListWithCounts = [];
    let totalMetaSum = 0;

    let grandTotalAccount = 0;
    let grandTotalGood = 0;
    let grandTotalBad = 0;
    let grandTotalPending = 0;
    let grandTotalAmountSum = 0;

    users.forEach((user) => {
      const userReports = filteredReports.filter((r) => r.user_id === user.id);
      let metaTotal = 0;
      let metaGood = 0;
      let metaBad = 0;
      let metaPending = 0;

      userReports.forEach((report) => {
        const workName = (report.work_name || "").toLowerCase();
        if (
          workName.includes("meta") ||
          workName.includes("ai") ||
          workName.includes("metai") ||
          workName === ""
        ) {
          metaTotal++;

          const st = (report.good_count || "pending").toLowerCase();
          if (st === "success" || st === "good") metaGood++;
          else if (st === "cancel" || st === "bad") metaBad++;
          else metaPending++;
        }
      });

      totalMetaSum += metaTotal;

      const calcMeta = calculateMetaPay(metaGood);
      grandTotalAmountSum += calcMeta;

      grandTotalAccount += metaTotal;
      grandTotalGood += metaGood;
      grandTotalBad += metaBad;
      grandTotalPending += metaPending;

      const userPayment = payments
        ? payments.find((p) => p.user_id === user.id)
        : null;

      memberListWithCounts.push({
        user,
        totalSubmissions: metaTotal,
        metaCount: metaTotal,
        metaGood,
        metaBad,
        metaPending,
        userPayment,
      });
    });

    if (document.getElementById("cardTotalAccount"))
      document.getElementById("cardTotalAccount").textContent =
        grandTotalAccount;
    if (document.getElementById("cardTotalGood"))
      document.getElementById("cardTotalGood").textContent = grandTotalGood;
    if (document.getElementById("cardTotalBad"))
      document.getElementById("cardTotalBad").textContent = grandTotalBad;
    if (document.getElementById("cardTotalPending"))
      document.getElementById("cardTotalPending").textContent =
        grandTotalPending;
    if (document.getElementById("cardTotalAmount"))
      document.getElementById("cardTotalAmount").textContent =
        `৳${grandTotalAmountSum.toFixed(2)}`;

    memberListWithCounts.sort(
      (a, b) => b.totalSubmissions - a.totalSubmissions,
    );
    tableBody.innerHTML = "";

    if (memberListWithCounts.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 font-medium">No members found for this date.</td></tr>`;
    } else {
      memberListWithCounts.forEach((item, index) => {
        const user = item.user;
        const initial = (user.full_name || user.username || "U")
          .charAt(0)
          .toUpperCase();
        const rowBg = index % 2 === 0 ? "bg-white" : "bg-slate-50/80";

        const calcMeta = calculateMetaPay(item.metaGood);
        const metaHtml = `
          <div class="text-sm font-extrabold text-slate-700">Total: ${item.metaCount}</div>
          <div class="flex flex-wrap gap-1.5 mt-1.5">
              <span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-extrabold border border-emerald-200">Good: ${item.metaGood}</span>
              <span class="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[11px] font-extrabold border border-emerald-200">Bad: ${item.metaBad}</span>
              <span class="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[11px] font-extrabold border border-amber-200">Pending: ${item.metaPending}</span>
          </div>`;

        const totalAmount = calcMeta;

        let paymentStatusHtml = "";
        let actionButtonsHtml = "";

        if (
          item.userPayment &&
          item.userPayment.status.toLowerCase() === "success"
        ) {
          paymentStatusHtml = `<span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-extrabold border border-emerald-300">Success</span>`;
          actionButtonsHtml = `
            <button onclick="openViewModal('${user.id}', '${user.full_name || user.username}')" class="px-3 py-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-xs font-extrabold transition">View</button>
            <button onclick="handleAction('${user.id}')" class="px-3 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-extrabold transition">Audit</button>
            <span class="text-xs font-bold text-emerald-600 px-1">Completed</span>`;
        } else if (
          item.userPayment &&
          item.userPayment.status.toLowerCase() === "pending"
        ) {
          paymentStatusHtml = `<span class="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-extrabold border border-amber-300">Pending</span>`;
          actionButtonsHtml = `
            <button onclick="openViewModal('${user.id}', '${user.full_name || user.username}')" class="px-3 py-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-xs font-extrabold transition">View</button>
            <button onclick="handleAction('${user.id}')" class="px-3 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-extrabold transition">Audit</button>
            <button onclick="cancelPendingPayment('${item.userPayment.id}')" class="px-3 py-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl text-xs font-extrabold transition">Cancel</button>`;
        } else {
          paymentStatusHtml = `<span class="text-xs text-slate-400 font-medium">Unpaid</span>`;
          actionButtonsHtml = `
            <button onclick="openViewModal('${user.id}', '${user.full_name || user.username}')" class="px-3 py-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-xs font-extrabold transition">View</button>
            <button onclick="handleAction('${user.id}')" class="px-3 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-extrabold transition">Audit</button>
            <button onclick="openPaymentModal('${user.id}', '${user.full_name || user.username}', ${totalAmount}, ${item.metaCount}, ${item.metaGood}, ${item.metaBad})" class="px-3 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl text-xs font-extrabold transition">Pay</button>`;
        }

        tableBody.innerHTML += `
          <tr class="${rowBg} hover:bg-indigo-50/50 transition border-b border-slate-100">
            <td class="py-4 px-6 flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold flex items-center justify-center text-sm">${initial}</div>
                <div>
                    <span class="font-extrabold text-slate-800 block text-sm">${user.full_name || user.username}</span>
                    <span class="text-xs text-slate-400">@${user.username || "user"}</span>
                </div>
            </td>
            <td class="py-4 px-6">${metaHtml}</td>
            <td class="py-4 px-6 font-extrabold text-emerald-600 bg-emerald-50/30">৳${totalAmount.toFixed(2)}</td>
            <td class="py-4 px-6">${paymentStatusHtml}</td>
            <td class="py-4 px-6 text-center space-x-1.5 whitespace-nowrap">${actionButtonsHtml}</td>
          </tr>`;
      });
    }

    if (document.getElementById("selectedMeta"))
      document.getElementById("selectedMeta").textContent = totalMetaSum;
    if (document.getElementById("totalMembers"))
      document.getElementById("totalMembers").textContent = users.length;
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-rose-500 font-medium">Error: ${error.message}</td></tr>`;
    showToast("Error: " + error.message, "error");
  }
}
async function openPaymentModal(
  userId,
  userName,
  amount,
  totalAcc,
  goodAcc,
  badAcc,
) {
  try {
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("payment_number, payment_method")
      .eq("id", userId)
      .maybeSingle();

    if (userError) throw new Error("Failed to fetch user payment info.");

    const paymentNumber =
      userData?.payment_number ||
      prompt(`Enter payment number for ${userName}:`, "01XXXXXXXXX");
    if (!paymentNumber) return;

    const paymentMethod = userData?.payment_method || "bKash";

    const selectedDate =
      document.getElementById("filterDate").value ||
      new Date().toISOString().split("T")[0];

    // এখানে নিশ্চিত করা হয়েছে যেন সঠিক ভ্যালুগুলো অবজেক্টে যায়
    const { error: insertError } = await supabaseClient
      .from("online_payments")
      .insert([
        {
          user_id: userId,
          date: selectedDate,
          amount: Number(amount) || 0,
          payment_number: paymentNumber,
          gateway: paymentMethod,
          status: "pending",
          work_details: `Meta AI Work`,
          good_account: Number(goodAcc) || 0,
          bad_account: Number(badAcc) || 0,
          total_account: Number(totalAcc) || 0,
          pay_amount: Number(amount) || 0,
          transaction_number: null,
        },
      ]);

    if (insertError) throw insertError;

    showToast(
      "Payment request submitted and status set to Pending successfully!",
      "success",
    );
    if (typeof fetchMemberData === "function") fetchMemberData();
    if (typeof fetchOnlinePaymentData === "function") fetchOnlinePaymentData();
  } catch (err) {
    showToast("Error processing payment: " + err.message, "error");
  }
}
async function cancelPendingPayment(paymentId) {
  try {
    const { error } = await supabaseClient
      .from("online_payments")
      .delete()
      .eq("id", paymentId);
    if (error) throw error;
    showToast("Pending payment cancelled successfully!", "success");
    fetchOnlinePaymentData();
    if (typeof fetchMemberData === "function") fetchMemberData();
  } catch (err) {
    showToast("Failed to cancel: " + err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const filterDateInput = document.getElementById("filterDate");
  if (filterDateInput) {
    const today = new Date();
    filterDateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }
});

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");

  let bgClass = "bg-emerald-600/90 text-white border-emerald-500/30";
  let icon = "✅";

  if (type === "error") {
    bgClass = "bg-rose-600/90 text-white border-rose-500/30";
    icon = "❌";
  } else if (type === "info") {
    bgClass = "bg-indigo-600/90 text-white border-indigo-500/30";
    icon = "ℹ️";
  }

  // Tailwind দিয়ে প্রিমিয়াম UI এবং অ্যানিমেশন ক্লাসসমূহ
  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl backdrop-blur-md border font-semibold text-xs transition-all duration-300 translate-y-[-20px] opacity-0 scale-95 ${bgClass}`;
  toast.innerHTML = `<span class="text-sm">${icon}</span> <span class="tracking-wide">${message}</span>`;

  container.appendChild(toast);

  // Smooth fade-in & slide down from top
  setTimeout(() => {
    toast.classList.remove("translate-y-[-20px]", "opacity-0", "scale-95");
    toast.classList.add("translate-y-0", "opacity-100", "scale-100");
  }, 20);

  // Remove after 3 seconds with fade-out
  setTimeout(() => {
    toast.classList.remove("translate-y-0", "opacity-100", "scale-100");
    toast.classList.add("translate-y-[-20px]", "opacity-0", "scale-95");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
