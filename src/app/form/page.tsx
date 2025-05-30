"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FormPage() {
  const router = useRouter();
  // 記憶提示互動狀態
  const [showMemoryHint, setShowMemoryHint] = useState(false);
  const [memoryConfirmed, setMemoryConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // 每次頁面載入都初始化記憶提示狀態
  useEffect(() => {
    setShowMemoryHint(false);
    setMemoryConfirmed(false);
  }, []);

  // 處理送出
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formDataObj = Object.fromEntries(new FormData(e.target as HTMLFormElement).entries());
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(formDataObj)) {
      data[key] = value.toString();
    }
    setFormData(data);
    setSubmitted(true);
  }

  // 根據填答內容自動判斷建議
  function getSuggestions(data: Record<string, string>) {
    const suggestions: string[] = [];
    // 認知功能：三物品、日期、地點任一錯誤
    if (
      (data["物品1"] && data["物品1"].trim() !== "鉛筆") ||
      (data["物品2"] && data["物品2"].trim() !== "汽車") ||
      (data["物品3"] && data["物品3"].trim() !== "書") ||
      !data["今天的日期（年/月/日）"] ||
      !data["現在在哪裡？"]
    ) {
      suggestions.push("請進行BHT-AD8量表評估");
    }
    // 行動功能：需輔具或椅子起身測試大於12秒
    const sitToStandSec = parseFloat(data["椅子起身測試秒數"]);
    if (data["需輔具？"] === "是" || (!isNaN(sitToStandSec) && sitToStandSec > 12)) {
      suggestions.push("請進行SPPB量表評估");
    }
    // 營養不良：體重減輕或食慾不振
    if (data["您的體重是否在無意中減輕了3公斤以上？"] === "是" || data["您是否曾經食慾不振？"] === "是") {
      suggestions.push("請進行MNA-SF量表評估");
    }
    // 視力障礙：困難為是，或視力測試/眼科調查未通過
    if (
      data["您的眼睛看遠、看近或閱讀是否有困難？"] === "是" ||
      data["WHO簡單視力「遠、近距離」測試"] === "未通過" ||
      data["高風險個案之眼科檢查調查表"] === "未通過"
    ) {
      suggestions.push("請依長者狀況轉介眼科檢查");
    }
    // 聽力障礙：耳語測試否
    if (data["長者是否兩耳都聽得到？"] === "否") {
      suggestions.push("請依長者狀況轉介醫療院所接受聽力檢測");
    }
    // 憂鬱：任一題是
    if (data["您是否常感到煩悶（心煩或台語「阿雜」），或沒有希望？"] === "是" || data["您是否減少很多的活動和興趣的事？"] === "是") {
      suggestions.push("請進行GDS-15量表評估");
    }
    return suggestions;
  }

  function downloadCSV() {
    // 只輸出實際填寫的欄位
    const keys = Object.keys(formData);
    const headers = keys;
    const values = keys.map(k => formData[k]?.replace(/\n/g, ' ') ?? '');
    const csvContent = [
      headers.join(","),
      values.map(v => `"${v.replace(/"/g, '""')}"`).join(",")
    ].join("\n");
    // 加上 BOM，確保 Excel 正常顯示中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ICOPE_問卷_${formData["姓名"] || "未命名"}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (submitted) {
    const suggestions = getSuggestions(formData);
    // 將基本資料與ICOPE量表分區
    const basicFields = [
      "姓名", "身分證統一編號", "性別", "生日_年", "生日_月", "生日_日", "具原住民身分", "電話", "手機號碼", "縣市", "鄉鎮市區", "村里", "詳細地址", "LINE註冊個人代碼"
    ];
    const chronicFields = [
      "慢性疾病_高血壓", "慢性疾病_糖尿病", "慢性疾病_高血脂症", "慢性疾病_心臟病", "慢性疾病_腦中風", "慢性疾病_腎臟病", "慢性疾病_精神疾病", "慢性疾病_COPD", "慢性疾病_癌症", "慢性疾病_其他", "慢性疾病_其他詳情"
    ];
    const unregisterFields = [
      "未註冊_無未帶智慧型手機", "未註冊_拒絕加入", "未註冊_網路連線異常", "未註冊_其他", "未註冊_其他詳情"
    ];
    const icopeFields = Object.keys(formData).filter(
      k => !basicFields.includes(k) && !chronicFields.includes(k) && !unregisterFields.includes(k)
    );
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                問卷提交成功
              </h3>
              <div className="mt-5 mb-8">
                <button
                  onClick={downloadCSV}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  下載 CSV 檔案
                </button>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4" style={{color:'#ff8800'}}>填寫結果總結</h2>
                <div className="mb-8">
                  <h3 className="font-semibold text-lg mb-2" style={{color:'#ff8800'}}>服務對象基本資料</h3>
                  <table className="w-full mb-4 border text-sm">
                    <tbody>
                      {basicFields.map(f => (
                        <tr key={f} className="border-b">
                          <td className="font-semibold bg-gray-50 px-2 py-1 w-40">{f.replace(/_/g, " ")}</td>
                          <td className="px-2 py-1">{formData[f] || "-"}</td>
                        </tr>
                      ))}
                      <tr className="border-b">
                        <td className="font-semibold bg-gray-50 px-2 py-1">慢性疾病史</td>
                        <td className="px-2 py-1">
                          {chronicFields.filter(f => formData[f] === "on").map(f => f.replace("慢性疾病_", "")).join("、")}
                          {formData["慢性疾病_其他詳情"] ? `（${formData["慢性疾病_其他詳情"]}）` : ""}
                          {chronicFields.every(f => !formData[f]) && "-"}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="font-semibold bg-gray-50 px-2 py-1">未註冊原因</td>
                        <td className="px-2 py-1">
                          {unregisterFields.filter(f => formData[f] === "on").map(f => f.replace("未註冊_", "")).join("、")}
                          {formData["未註冊_其他詳情"] ? `（${formData["未註冊_其他詳情"]}）` : ""}
                          {unregisterFields.every(f => !formData[f]) && "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mb-8">
                  <h3 className="font-semibold text-lg mb-2" style={{color:'#ff8800'}}>ICOPE 長者功能評估量表</h3>
                  <table className="w-full border text-sm">
                    <tbody>
                      {icopeFields.map(f => (
                        <tr key={f} className="border-b">
                          <td className="font-semibold bg-gray-50 px-2 py-1 w-64">{f.replace(/_/g, " ")}</td>
                          <td className="px-2 py-1">{formData[f] || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mb-8">
                  <h3 className="font-semibold text-lg mb-2" style={{color:'#ff8800'}}>建議</h3>
                  {suggestions.length === 0 ? (
                    <div className="text-green-700 font-semibold flex items-center gap-2"><span>✔️</span>無需進一步量表評估</div>
                  ) : (
                    <ul className="list-disc pl-6 text-red-700 space-y-1">
                      {suggestions.map((s, i) => <li key={i} className="flex items-center gap-2"><span>⚠️</span>{s}</li>)}
                    </ul>
                  )}
                </div>
                <div className="text-gray-500 text-sm">可截圖保存此頁，或由主持人現場查看。</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6 relative">
      {/* Modal 記憶提示浮層 */}
      {showMemoryHint && !memoryConfirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-xs w-full flex flex-col items-center">
            <div className="mb-2 font-semibold text-lg text-orange-600">請記住以下三個物品：</div>
            <ul className="list-disc pl-6 text-lg mb-4">
              <li>鉛筆</li>
              <li>汽車</li>
              <li>書</li>
            </ul>
            <button
              className="mt-2 px-6 py-2 rounded text-white font-semibold"
              style={{background:'#ff8800'}}
              onClick={() => { setShowMemoryHint(false); setMemoryConfirmed(true); }}
            >
              我已記住，繼續填寫
            </button>
          </div>
        </div>
      )}
      {/* 表單內容 */}
      <form style={{ color: '#000000', backgroundColor: '#FFFFFF' }} onSubmit={handleSubmit} className={showMemoryHint && !memoryConfirmed ? 'pointer-events-none opacity-40' : ''}>
        <h2 className="text-2xl font-bold mb-4" style={{color:'#ff8800'}}>服務對象基本資料</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 基本資料欄位 */}
          <div>
            <label className="block mb-1 font-semibold">姓名 <span className="text-red-500">*</span></label>
            <input name="姓名" type="text" className="w-full border rounded px-2 py-1" required />
          </div>
          <div>
            <label className="block mb-1 font-semibold">身分證統一編號 <span className="text-red-500">*</span></label>
            <input name="身分證統一編號" type="text" className="w-full border rounded px-2 py-1" required />
          </div>
          <div>
            <label className="block mb-1 font-semibold">性別 <span className="text-red-500">*</span></label>
            <select name="性別" className="w-full border rounded px-2 py-1" required>
              <option value="">請選擇</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">生日 <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input name="生日_年" type="number" placeholder="年" className="w-1/3 border rounded px-2 py-1" required />
              <input name="生日_月" type="number" placeholder="月" className="w-1/3 border rounded px-2 py-1" required />
              <input name="生日_日" type="number" placeholder="日" className="w-1/3 border rounded px-2 py-1" required />
            </div>
          </div>
          <div>
            <label className="block mb-1 font-semibold">具原住民身分 <span className="text-red-500">*</span></label>
            <select name="具原住民身分" className="w-full border rounded px-2 py-1" required>
              <option value="">請選擇</option>
              <option value="是">是</option>
              <option value="否">否</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">電話 <span className="text-red-500">*</span></label>
            <input name="電話" type="text" className="w-full border rounded px-2 py-1" required />
          </div>
          <div>
            <label className="block mb-1 font-semibold">手機號碼 <span className="text-red-500">*</span></label>
            <input name="手機號碼" type="text" className="w-full border rounded px-2 py-1" required />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 font-semibold">現居地址 <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              <input name="縣市" type="text" placeholder="縣(市)" className="w-1/4 border rounded px-2 py-1" required />
              <input name="鄉鎮市區" type="text" placeholder="鄉鎮市區" className="w-1/4 border rounded px-2 py-1" required />
              <input name="村里" type="text" placeholder="村里" className="w-1/4 border rounded px-2 py-1" required />
              <input name="詳細地址" type="text" placeholder="詳細地址" className="w-1/4 border rounded px-2 py-1" required />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 font-semibold">慢性疾病史（可複選）</label>
            <div className="flex flex-wrap gap-4">
              <label><input name="慢性疾病_高血壓" type="checkbox" /> 高血壓</label>
              <label><input name="慢性疾病_糖尿病" type="checkbox" /> 糖尿病</label>
              <label><input name="慢性疾病_高血脂症" type="checkbox" /> 高血脂症</label>
              <label><input name="慢性疾病_心臟病" type="checkbox" /> 心臟病</label>
              <label><input name="慢性疾病_腦中風" type="checkbox" /> 腦中風</label>
              <label><input name="慢性疾病_腎臟病" type="checkbox" /> 腎臟病</label>
              <label><input name="慢性疾病_精神疾病" type="checkbox" /> 精神疾病</label>
              <label><input name="慢性疾病_COPD" type="checkbox" /> 慢性阻塞性肺部疾病(COPD)</label>
              <label><input name="慢性疾病_癌症" type="checkbox" /> 癌症</label>
              <label><input name="慢性疾病_其他" type="checkbox" /> 其他 <input name="慢性疾病_其他詳情" type="text" className="border rounded px-2 py-1 ml-1" placeholder="請填寫" /></label>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 font-semibold">「國健署長者量六力」LINE註冊個人代碼 <span className="text-red-500">*</span></label>
            <input name="LINE註冊個人代碼" type="text" className="w-full border rounded px-2 py-1" required />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1 font-semibold">未註冊原因（可複選）</label>
            <div className="flex flex-wrap gap-4">
              <label><input name="未註冊_無未帶智慧型手機" type="checkbox" /> 無/未帶智慧型手機</label>
              <label><input name="未註冊_拒絕加入" type="checkbox" /> 拒絕加入</label>
              <label><input name="未註冊_網路連線異常" type="checkbox" /> 網路/連線異常</label>
              <label><input name="未註冊_其他" type="checkbox" /> 其他 <input name="未註冊_其他詳情" type="text" className="border rounded px-2 py-1 ml-1" placeholder="請填寫" /></label>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4" style={{color:'#ff8800'}}>ICOPE 長者功能評估量表</h2>
        {/* 顯示記憶提示按鈕 */}
        {!memoryConfirmed && (
          <div className="mb-6">
            <button
              type="button"
              className="px-4 py-2 rounded hover:brightness-110 text-white font-semibold"
              style={{background:'#ff8800'}}
              onClick={() => setShowMemoryHint(true)}
              disabled={showMemoryHint || memoryConfirmed}
            >
              顯示記憶提示
            </button>
          </div>
        )}
        {/* A. 認知功能 */}
        <fieldset className="border rounded p-4 mb-4">
          <legend className="font-semibold text-lg" style={{color:'#ff8800'}}>A. 認知功能</legend>
          <div className="mb-2">
            <label className="block mb-1">2. 今天的日期（年/月/日） <span className="text-red-500">*</span></label>
            <input name="今天的日期（年/月/日）" type="text" className="w-full border rounded px-2 py-1" required placeholder="請填寫" />
          </div>
          <div className="mb-2">
            <label className="block mb-1">3. 現在在哪裡？ <span className="text-red-500">*</span></label>
            <input name="現在在哪裡？" type="text" className="w-full border rounded px-2 py-1" required placeholder="請填寫" />
          </div>
          <div className="mb-2">
            <label className="block mb-1">4. 剛剛看到的三個物品是？（請填寫三項） <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input name="物品1" type="text" className="w-1/3 border rounded px-2 py-1" required placeholder="物品1" />
              <input name="物品2" type="text" className="w-1/3 border rounded px-2 py-1" required placeholder="物品2" />
              <input name="物品3" type="text" className="w-1/3 border rounded px-2 py-1" required placeholder="物品3" />
            </div>
          </div>
        </fieldset>
        {/* B. 行動功能 */}
        <fieldset className="border rounded p-4 mb-4">
          <legend className="font-semibold text-lg" style={{color:'#ff8800'}}>B. 行動功能</legend>
          <div className="mb-2">
            <label className="block mb-1">1. 椅子起身測試（12秒內，雙手抱胸，連續起立坐下5次） <span className="text-red-500">*</span></label>
            <input name="椅子起身測試秒數" type="number" className="w-1/2 border rounded px-2 py-1" required placeholder="秒數" min="0" />
          </div>
          <div className="mb-2">
            <label className="block mb-1">2. 需輔具？ <span className="text-red-500">*</span></label>
            <select name="需輔具？" className="w-1/2 border rounded px-2 py-1" required>
              <option value="">請選擇</option>
              <option value="是">是</option>
              <option value="否">否</option>
            </select>
          </div>
        </fieldset>
        {/* C. 營養不良 */}
        <fieldset className="border rounded p-4 mb-4">
          <legend className="font-semibold text-lg" style={{color:'#ff8800'}}>C. 營養不良</legend>
          <div className="mb-2">
            <label className="block mb-1">1. 過去三個月，您的體重是否在無意中減輕了3公斤以上？ <span className="text-red-500">*</span></label>
            <select name="您的體重是否在無意中減輕了3公斤以上？" className="w-1/2 border rounded px-2 py-1" required>
              <option value="">請選擇</option>
              <option value="是">是</option>
              <option value="否">否</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="block mb-1">2. 過去三個月，您是否曾經食慾不振？ <span className="text-red-500">*</span></label>
            <select name="您是否曾經食慾不振？" className="w-1/2 border rounded px-2 py-1" required>
              <option value="">請選擇</option>
              <option value="是">是</option>
              <option value="否">否</option>
            </select>
          </div>
        </fieldset>
        {/* D. 視力障礙 */}
        <fieldset className="border rounded p-4 mb-4">
          <legend className="font-semibold text-lg" style={{color:'#ff8800'}}>D. 視力障礙</legend>
          <div className="mb-2">
            <label className="block mb-1">1. 您的眼睛看遠、看近或閱讀是否有困難？ <span className="text-red-500">*</span></label>
            <select name="您的眼睛看遠、看近或閱讀是否有困難？" className="w-1/2 border rounded px-2 py-1" required>
              <option value="">請選擇</option>
              <option value="是">是</option>
              <option value="否">否</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="block mb-1">2. WHO簡單視力「遠、近距離」測試 <span className="text-red-500">*</span></label>
            <select name="WHO簡單視力「遠、近距離」測試" className="w-1/2 border rounded px-2 py-1" required>
              <option value="">請選擇</option>
              <option value="通過">通過</option>
              <option value="未通過">未通過</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="block mb-1">3. 高風險個案之眼科檢查調查表 <span className="text-red-500">*</span></label>
            <select name="高風險個案之眼科檢查調查表" className="w-1/2 border rounded px-2 py-1" required>
              <option value="">請選擇</option>
              <option value="通過">通過</option>
              <option value="未通過">未通過</option>
            </select>
          </div>
        </fieldset>
        {/* E. 聽力障礙 */}
        <fieldset className="border rounded p-4 mb-4">
          <legend className="font-semibold text-lg" style={{color:'#ff8800'}}>E. 聽力障礙</legend>
          <div className="mb-2">
            <label className="block mb-1">1. 請執行耳語測試，長者是否兩耳都聽得到？ <span className="text-red-500">*</span></label>
            <select name="長者是否兩耳都聽得到？" className="w-1/2 border rounded px-2 py-1" required>
              <option value="">請選擇</option>
              <option value="是">是</option>
              <option value="否">否</option>
            </select>
          </div>
        </fieldset>
        {/* F. 憂鬱 */}
        <fieldset className="border rounded p-4 mb-4">
          <legend className="font-semibold text-lg" style={{color:'#ff8800'}}>F. 憂鬱</legend>
          <div className="mb-2">
            <label className="block mb-1">1. 過去兩週，您是否常感到煩悶（心煩或台語「阿雜」），或沒有希望？ <span className="text-red-500">*</span></label>
            <select name="您是否常感到煩悶（心煩或台語「阿雜」），或沒有希望？" className="w-1/2 border rounded px-2 py-1" required>
              <option value="">請選擇</option>
              <option value="是">是</option>
              <option value="否">否</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="block mb-1">2. 過去兩週，您是否減少很多的活動和興趣的事？ <span className="text-red-500">*</span></label>
            <select name="您是否減少很多的活動和興趣的事？" className="w-1/2 border rounded px-2 py-1" required>
              <option value="">請選擇</option>
              <option value="是">是</option>
              <option value="否">否</option>
            </select>
          </div>
        </fieldset>
        <div className="flex justify-end mt-8">
          <button type="submit" className="px-8 py-3 rounded-lg shadow hover:brightness-110 font-semibold text-lg" style={{background:'#ff8800', color:'#fff'}}>
            送出
          </button>
        </div>
      </form>
    </div>
  );
} 
