async function updatePopup() {
  let result = await chrome.storage.local.get(["requests", "listening"]);
  let requests = result.requests;
  let listening = result.listening;
  updateButtonState(listening);
  const popup = document.getElementById("popup");
  popup.innerHTML = "";
  if (requests && requests.length == 0) {
    const noRequests = document.createElement("p");
    noRequests.innerHTML = "Start recording now!";
    noRequests.className = "start-message";

    popup.appendChild(noRequests);
    document.getElementById("clear").style.display = "none";
    document.getElementById("download").style.display = "none"; 
  }
  if (requests && requests.length > 0) {
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];

      const requestDiv = document.createElement("div");
      requestDiv.className = "request-div";

      const requestMethod = document.createElement("p");
      requestMethod.className = "request-method";
      const requestLabel = document.createElement("p");
      requestLabel.innerHTML = request.label;
      requestMethod.innerHTML = request.method;

      requestDiv.appendChild(requestMethod);
      requestDiv.appendChild(requestLabel);
      popup.appendChild(requestDiv);
    }
    document.getElementById("clear").style.display = "block";
    if (document.getElementById("start-stop").innerHTML === "Start") {
      document.getElementById("download").style.display = "block"; 
    } else {
      document.getElementById("download").style.display = "none"; 
    }
  } else {
    console.log("requests is undefined");
    document.getElementById("clear").style.display = "none";
    document.getElementById("download").style.display = "none"; 
  }
}
async function clearRequests() {
  chrome.runtime.sendMessage({ action: "clearRequests" });
  await chrome.storage.local.set({ requests: [] });

  updatePopup();
}

document.getElementById("clear").addEventListener("click", function () {
  clearRequests();
  chrome.storage.local.set({ requests: [] });
  chrome.storage.local.set({ listening: false });
});

document
  .getElementById("start-stop")
  .addEventListener("click", async function () {
    const button = document.getElementById("start-stop");

    if (button.innerHTML === "Start") {
      button.style.backgroundColor = "red";
      button.innerHTML = "Stop";
      chrome.runtime.sendMessage({ action: "start" });
      chrome.storage.local.set({ listening: true }, updatePopup);
      chrome.runtime.sendMessage({ action: "start" });
    } else if (button.innerHTML === "Stop") {
      document.getElementById("download").style.display = "none";
      button.innerHTML = "Start";
      button.style.backgroundColor = "green";
      chrome.runtime.sendMessage({ action: "stop" });
      chrome.storage.local.set({ listening: false }, updatePopup);
    }
  });

function updateButtonState(listening) {
  const button = document.getElementById("start-stop");
  if (listening) {
    button.style.backgroundColor = "red";
    button.innerHTML = "Stop";
  } else {
    button.innerHTML = "Start";
    button.style.backgroundColor = "green";
  }
}
document.getElementById("download").addEventListener("click", function () {
  chrome.storage.local.get(["requests"], function (result) {
    let requests = result.requests;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">\n`;
    xml += `<hashTree>\n`;
    xml += `<TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Test Plan">\n`;
    xml += `<elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables">\n`;
    xml += `<collectionProp name="Arguments.arguments"/>\n`;
    xml += `</elementProp>\n`;
    xml += `</TestPlan>\n`;

    xml += `<hashTree>\n`;

    xml += `<CookieManager guiclass="CookiePanel" testclass="CookieManager" testname="HTTP Cookie Manager">\n`;
    xml += `<collectionProp name="CookieManager.cookies"/>\n`;
    xml += `<boolProp name="CookieManager.clearEachIteration">false</boolProp>\n`;
    xml += `<boolProp name="CookieManager.controlledByThreadGroup">false</boolProp>\n`;
    xml += `</CookieManager>\n`;
    xml += `<hashTree/>\n`;

    xml += `<CacheManager guiclass="CacheManagerGui" testclass="CacheManager" testname="HTTP Cache Manager">\n`;
    xml += `<boolProp name="clearEachIteration">false</boolProp>\n`;
    xml += `<boolProp name="useExpires">true</boolProp>\n`;
    xml += `<boolProp name="CacheManager.controlledByThread">false</boolProp>\n`;
    xml += `</CacheManager>\n`;
    xml += `<hashTree/>\n`;

    xml += `<DNSCacheManager guiclass="DNSCachePanel" testclass="DNSCacheManager" testname="DNS Cache Manager">\n`;
    xml += `<collectionProp name="DNSCacheManager.servers"/>\n`;
    xml += `<collectionProp name="DNSCacheManager.hosts"/>\n`;
    xml += `<boolProp name="DNSCacheManager.clearEachIteration">true</boolProp>\n`;
    xml += `<boolProp name="DNSCacheManager.isCustomResolver">false</boolProp>\n`;
    xml += `</DNSCacheManager>\n`;
    xml += `<hashTree/>\n`;

    xml += `<ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Thread Group">\n`;
    xml += `<intProp name="ThreadGroup.num_threads">1</intProp>\n`;
    xml += `<intProp name="ThreadGroup.ramp_time">1</intProp>\n`;
    xml += `<boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>\n`;
    xml += `<stringProp name="ThreadGroup.on_sample_error">continue</stringProp>\n`;
    xml += `<elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller">\n`;
    xml += `<stringProp name="LoopController.loops">1</stringProp>\n`;
    xml += `<boolProp name="LoopController.continue_forever">false</boolProp>\n`;
    xml += `</elementProp>\n`;
    xml += `</ThreadGroup>\n`;
    xml += `<hashTree>\n`;

    xml += `<TransactionController guiclass="TransactionControllerGui" testclass="TransactionController" testname="Transaction Controller">\n`;
    xml += `<boolProp name="TransactionController.includeTimers">false</boolProp>\n`;
    xml += `</TransactionController>\n`;
    xml += `<hashTree>\n`;
    requests.forEach((request) => {
      let url = new URL(request.url);
      xml += `<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${url.pathname}">\n`;
      xml += `<stringProp name="HTTPSampler.protocol">${url.protocol.replace(
        ":",
        ""
      )}</stringProp>\n`;
      xml += `<stringProp name="HTTPSampler.domain">${url.hostname}</stringProp>\n`;
      xml += `<stringProp name="HTTPSampler.port">${
        url.port || (url.protocol === "https:" ? "443" : "80")
      }</stringProp>\n`;
      xml += `<stringProp name="HTTPSampler.path">${url.pathname}</stringProp>\n`;
      xml += `<stringProp name="HTTPSampler.method">${request.method}</stringProp>\n`;
      xml += `<boolProp name="HTTPSampler.use_keepalive">true</boolProp>\n`;
      xml += `<boolProp name="HTTPSampler.follow_redirects">true</boolProp>\n`;
      xml += `<boolProp name="HTTPSampler.postBodyRaw">true</boolProp>\n`;
      xml += `<elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables">\n`;
      xml += `<collectionProp name="Arguments.arguments">\n`;

      if (
        request.method === "POST" ||
        request.method === "PUT" ||
        request.method === "PATCH"
      ) {
        xml += `<elementProp name="" elementType="HTTPArgument">\n`;
        xml += `<boolProp name="HTTPArgument.always_encode">false</boolProp>\n`;
        xml += `<stringProp name="Argument.value">${
          request.body || ""
        }</stringProp>\n`;
        xml += `<stringProp name="Argument.metadata">=</stringProp>\n`;
        xml += `</elementProp>\n`;
      }

      xml += `</collectionProp>\n`;
      xml += `</elementProp>\n`;

      xml += `</HTTPSamplerProxy>\n`;

      xml += `<hashTree>\n`;
      xml += `<HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager">\n`;
      xml += `<collectionProp name="HeaderManager.headers">\n`;

      request.headers.forEach((header) => {
        xml += `<elementProp name="${header.name}" elementType="Header">\n`;
        xml += `<stringProp name="Header.name">${header.name}</stringProp>\n`;
        xml += `<stringProp name="Header.value">${header.value}</stringProp>\n`;
        xml += `</elementProp>\n`;
      });

      xml += `</collectionProp>\n`;
      xml += `</HeaderManager>\n`;
      xml += `</hashTree>\n`;
    });
    xml += `</hashTree>\n`;

    xml += `</hashTree>\n`;
    xml += `</hashTree>\n`;
    xml += `</hashTree>\n`;
    xml += `</jmeterTestPlan>`;

    let blob = new Blob([xml], { type: "application/xml" });

    let url = URL.createObjectURL(blob);

    let link = document.createElement("a");
    link.href = url;

    let testName = document.getElementById("testName").value || "testplan";
    link.download = testName + ".jmx";
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  });
});

updatePopup();
