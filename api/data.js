// api/data.js
// Single JSON store for all site data: products, testimonials, faqs, orders, carts
// Uses Vercel Blob (private store) as a simple persistent key-value store

const { put, list, get } = require('@vercel/blob');

const DATA_FILENAME = 'mubadir-site-data.json';

const DEFAULT_DATA = {
  products: [
    {
      id: 'workshop1', active: true, order: 1,
      name: 'كيف تبدأ مشروعك من المنزل برأس مال صفر',
      tagline: 'ورشة تدريبية أونلاين — 3 أيام',
      desc: 'ورشة عملية تأخذك من اكتشاف فكرة مشروعك إلى بناء خطة عملية بسيطة لبدء مشروعك من المنزل بدون رأس مال وبدون خبرة سابقة.',
      duration: '3 أيام', durationSub: 'كل يوم ساعتين',
      format: 'أونلاين', formatSub: 'عبر منصة زووم',
      sessions: '3 جلسات', sessionsSub: 'عملية وتطبيقية',
      outputs: [
        'اكتشاف فكرة مشروع مناسبة لك من المنزل',
        'خطوات عملية لبدء مشروعك من الصفر',
        'بناء خطة بسيطة وواضحة لمشروعك',
        'طرق مجربة للتسويق وجذب العملاء',
        'كيف تتوسع وتحول مشروعك لدخل مستدام'
      ],
      extras: ['ملف أدوات ونماذج مجانية', 'دعم ومتابعة بعد الورشة', 'مساعدتك على تطبيق ما تعلمته'],
      price: 10, currency: 'ر.ع',
      cta: 'سجّل في الورشة الآن'
    }
  ],
  testimonials: [
    { id: 't1', text: 'كنت أعتقد أنني أحتاج رأس مال كبير لأبدأ، لكن الورشة غيّرت تفكيري بالكامل وبدأت مشروعي الصغير من البيت بأقل تكلفة ممكنة.', name: 'أ. سارة الهنائية', role: 'بدأت مشروع تجميل منزلي', init: 'س' },
    { id: 't2', text: 'كنت متردداً جداً قبل الورشة، لكن بعد 3 أيام فقط خرجت بخطة واضحة وبدأت التنفيذ من نفس الأسبوع. شكراً للكوتش عمر.', name: 'م. سلطان البلوشي', role: 'بدأ مشروع توصيل طلبات', init: 'س' },
    { id: 't3', text: 'لم تكن لدي أي خبرة سابقة، لكن أسلوب الشرح كان بسيطاً وعملياً جداً. الآن لدي مشروعي الخاص وأعمل من المنزل بدخل ثابت.', name: 'أ. فاطمة الزدجالية', role: 'ربة منزل بدأت متجر إلكتروني', init: 'ف' }
  ],
  faqs: [
    { id: 'f1', q: 'هل أحتاج خبرة سابقة في ريادة الأعمال؟', a: 'لا إطلاقاً! الورشة مصممة خصيصاً لمن لا يملك أي خبرة سابقة، ونبدأ معك من الصفر تماماً.' },
    { id: 'f2', q: 'هل الورشة أونلاين أم حضورية؟', a: 'الورشة بالكامل أونلاين عبر منصة زووم، يمكنك حضورها من أي مكان وأنت في بيتك.' },
    { id: 'f3', q: 'كم مدة الورشة؟', a: 'الورشة 3 أيام تدريبية، كل يوم جلسة مدتها ساعتان تقريباً.' },
    { id: 'f4', q: 'هل فعلاً يمكنني البدء برأس مال صفر؟', a: 'نعم، الورشة تركز على نماذج مشاريع لا تحتاج رأس مال كبير، بل تعتمد على مهاراتك ووقتك في البداية.' },
    { id: 'f5', q: 'هل يوجد دعم بعد انتهاء الورشة؟', a: 'نعم، تحصل على ملف أدوات ونماذج جاهزة، بالإضافة إلى متابعة ودعم بعد انتهاء الورشة لمساعدتك على التطبيق.' },
    { id: 'f6', q: 'كيف يتم التسجيل والدفع؟', a: 'اضغط على زر التسجيل واملأ بياناتك، وسيتواصل معك فريقنا عبر الواتساب لتأكيد التسجيل وتفاصيل الدفع.' },
    { id: 'f7', q: 'هل يوجد عدد محدد للمقاعد؟', a: 'نعم، الورشة بعدد مقاعد محدود لضمان جودة التفاعل والمتابعة الشخصية مع كل مشارك.' }
  ],
  orders: [],
  carts: [],
  settings: { whatsapp: '96877684008' }
};

async function getCurrentData() {
  try {
    const { blobs } = await list({ prefix: DATA_FILENAME, access: 'private' });
    if (blobs.length === 0) return DEFAULT_DATA;
    // If multiple blobs share the prefix (can happen with Vercel Blob's
    // versioning), always pick the most recently uploaded one.
    const blob = blobs.reduce((latest, b) =>
      new Date(b.uploadedAt) > new Date(latest.uploadedAt) ? b : latest
    , blobs[0]);
    const result = await get(blob.pathname, { access: 'private' });
    if (!result || !result.stream) return DEFAULT_DATA;
    const text = await new Response(result.stream).text();
    const json = JSON.parse(text);
    return { ...DEFAULT_DATA, ...json };
  } catch (err) {
    console.error('getCurrentData error:', err);
    return DEFAULT_DATA;
  }
}

async function saveData(data) {
  await put(DATA_FILENAME, JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    allowOverwrite: true,
    addRandomSuffix: false
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const data = await getCurrentData();
    res.status(200).json(data);
    return;
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      const current = await getCurrentData();
      const updated = { ...current, ...body };
      await saveData(updated);
      res.status(200).json({ ok: true, data: updated });
    } catch (err) {
      console.error('POST error:', err);
      res.status(500).json({ ok: false, error: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
