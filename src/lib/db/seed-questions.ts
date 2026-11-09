/**
 * Ngân hàng câu hỏi khởi tạo (chỉ nạp khi bảng questions trống).
 * Nội dung được viết thận trọng, xoay quanh kiến thức công nghệ phổ thông và thông tin công khai của FPT Telecom.
 * Đội ngũ Marketing nên rà soát & chỉnh sửa trong Admin → Câu hỏi trước khi chạy chiến dịch.
 */
export type SeedQuestion = {
  type: "mcq" | "fill" | "product";
  product: "internet" | "wifi" | "camera" | "smarthome" | "fptplay" | "general";
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const SEED_QUESTIONS: SeedQuestion[] = [
  // ---- Dạng A – Trắc nghiệm nhanh ----
  {
    type: "mcq", product: "wifi", difficulty: "easy",
    question: "Thiết bị nào giúp khách hàng kết nối Internet không dây tại nhà?",
    options: ["Router WiFi", "Máy in", "Loa Bluetooth", "Máy chiếu"],
    correctIndex: 0,
    explanation: "Router WiFi phát sóng không dây để điện thoại, laptop, TV… trong nhà kết nối Internet.",
  },
  {
    type: "mcq", product: "general", difficulty: "easy",
    question: "Số tổng đài hỗ trợ khách hàng của FPT Telecom là?",
    options: ["1900 6600", "1800 1090", "1900 1000", "113"],
    correctIndex: 0,
    explanation: "Khách hàng FPT Telecom có thể gọi tổng đài 1900 6600 để được hỗ trợ.",
  },
  {
    type: "mcq", product: "general", difficulty: "medium",
    question: "Công ty Cổ phần Viễn thông FPT (FPT Telecom) được thành lập vào năm nào?",
    options: ["1997", "2005", "1988", "2010"],
    correctIndex: 0,
    explanation: "FPT Telecom được thành lập ngày 31/01/1997.",
  },
  {
    type: "mcq", product: "wifi", difficulty: "easy",
    question: "Để sóng WiFi phủ tốt nhất, nên đặt Router ở vị trí nào?",
    options: ["Nơi cao, thoáng, gần trung tâm ngôi nhà", "Trong tủ kín", "Sát lò vi sóng", "Dưới gầm giường"],
    correctIndex: 0,
    explanation: "Vị trí cao, thoáng, ở trung tâm giúp sóng lan đều; vật cản kim loại và lò vi sóng làm suy hao sóng.",
  },
  {
    type: "mcq", product: "wifi", difficulty: "medium",
    question: "Nhà nhiều tầng, nhiều phòng bị “góc chết” WiFi — giải pháp phù hợp nhất là?",
    options: ["Hệ thống WiFi Mesh", "Tắt bớt điện thoại", "Đổi mật khẩu WiFi", "Rút điện Router liên tục"],
    correctIndex: 0,
    explanation: "WiFi Mesh dùng nhiều điểm phát phối hợp với nhau, phủ sóng liền mạch cho cả ngôi nhà.",
  },
  {
    type: "mcq", product: "internet", difficulty: "easy",
    question: "Đơn vị nào thường dùng để đo tốc độ đường truyền Internet?",
    options: ["Mbps", "kWh", "mAh", "Hz"],
    correctIndex: 0,
    explanation: "Mbps (megabit mỗi giây) là đơn vị phổ biến để đo tốc độ Internet.",
  },
  {
    type: "mcq", product: "internet", difficulty: "medium",
    question: "Công nghệ truyền dẫn nào cho Internet cáp quang tốc độ cao đến tận nhà?",
    options: ["Cáp quang (FTTH)", "Cáp đồng điện thoại", "Sóng radio AM", "Hồng ngoại"],
    correctIndex: 0,
    explanation: "FTTH (Fiber To The Home) đưa cáp quang đến tận nhà, cho tốc độ cao và ổn định.",
  },
  {
    type: "mcq", product: "wifi", difficulty: "medium",
    question: "Băng tần WiFi 5 GHz so với 2.4 GHz thường có đặc điểm gì?",
    options: ["Tốc độ cao hơn nhưng vùng phủ ngắn hơn", "Chậm hơn nhưng xuyên tường tốt hơn", "Không dùng được cho điện thoại", "Chỉ dùng cho TV"],
    correctIndex: 0,
    explanation: "5 GHz cho tốc độ cao, ít nhiễu nhưng suy hao nhanh qua vật cản; 2.4 GHz phủ xa hơn nhưng chậm hơn.",
  },

  // ---- Dạng B – Điền vào chỗ trống ----
  {
    type: "fill", product: "wifi", difficulty: "easy",
    question: "WiFi 6 còn được biết đến với tên chuẩn kỹ thuật IEEE 802.11___.",
    options: ["ax", "ac", "n", "b"],
    correctIndex: 0,
    explanation: "WiFi 6 = IEEE 802.11ax; WiFi 5 = 802.11ac; WiFi 7 = 802.11be.",
  },
  {
    type: "fill", product: "wifi", difficulty: "hard",
    question: "WiFi 7 tương ứng với chuẩn IEEE 802.11___.",
    options: ["be", "ax", "ac", "g"],
    correctIndex: 0,
    explanation: "WiFi 7 là chuẩn IEEE 802.11be, bổ sung kênh 320 MHz và công nghệ Multi-Link Operation (MLO).",
  },
  {
    type: "fill", product: "internet", difficulty: "easy",
    question: "Gói Internet có tốc độ 1 Gbps tương đương khoảng ___ Mbps.",
    options: ["1000", "100", "10", "10000"],
    correctIndex: 0,
    explanation: "1 Gbps = 1000 Mbps.",
  },
  {
    type: "fill", product: "general", difficulty: "easy",
    question: "Tổng đài hỗ trợ của FPT Telecom: 1900 ___.",
    options: ["6600", "1000", "8198", "9095"],
    correctIndex: 0,
    explanation: "Tổng đài FPT Telecom là 1900 6600.",
  },
  {
    type: "fill", product: "camera", difficulty: "medium",
    question: "Camera lưu trữ dữ liệu hình ảnh trên máy chủ từ xa qua Internet được gọi là camera ___.",
    options: ["Cloud", "Analog", "Phim", "Hồng ngoại"],
    correctIndex: 0,
    explanation: "Camera Cloud lưu video trên đám mây, xem lại được mọi lúc kể cả khi thiết bị tại nhà gặp sự cố.",
  },
  {
    type: "fill", product: "smarthome", difficulty: "medium",
    question: "Trong nhà thông minh, ___ tự động bật đèn khi phát hiện có người đi qua.",
    options: ["Cảm biến chuyển động", "Ổ cắm thường", "Bóng đèn sợi đốt", "Công tắc cơ"],
    correctIndex: 0,
    explanation: "Cảm biến chuyển động gửi tín hiệu kích hoạt kịch bản bật đèn tự động.",
  },

  // ---- Dạng C – Kiến thức sản phẩm ----
  {
    type: "product", product: "camera", difficulty: "easy",
    question: "FPT Camera hỗ trợ khách hàng chủ yếu trong nhu cầu nào?",
    options: ["Giám sát an ninh, xem hình ảnh ngôi nhà từ xa", "Phát nhạc karaoke", "In ấn tài liệu", "Sạc pin điện thoại"],
    correctIndex: 0,
    explanation: "FPT Camera giúp quan sát ngôi nhà, cửa hàng từ xa qua điện thoại và lưu trữ hình ảnh an ninh.",
  },
  {
    type: "product", product: "wifi", difficulty: "easy",
    question: "WiFi 7 là công nghệ thuộc lĩnh vực nào?",
    options: ["Mạng không dây", "Năng lượng mặt trời", "Truyền hình vệ tinh", "Thiết bị gia dụng"],
    correctIndex: 0,
    explanation: "WiFi 7 là thế hệ mới của chuẩn mạng không dây, cho tốc độ cao và độ trễ thấp.",
  },
  {
    type: "product", product: "fptplay", difficulty: "easy",
    question: "FPT Play mang đến cho khách hàng trải nghiệm gì?",
    options: ["Giải trí: truyền hình, phim, thể thao trên nhiều thiết bị", "Chuyển tiền ngân hàng", "Gọi taxi", "Đặt vé máy bay"],
    correctIndex: 0,
    explanation: "FPT Play là nền tảng giải trí với truyền hình, phim, thể thao… xem trên TV, điện thoại, máy tính.",
  },
  {
    type: "product", product: "smarthome", difficulty: "easy",
    question: "Hệ thống Smart Home có thể hỗ trợ điều khiển những thiết bị nào?",
    options: ["Đèn, rèm cửa, công tắc, cảm biến…", "Chỉ điều khiển tivi", "Chỉ khóa xe máy", "Không điều khiển thiết bị nào"],
    correctIndex: 0,
    explanation: "Smart Home kết nối và điều khiển nhiều thiết bị như đèn, rèm, công tắc, cảm biến qua ứng dụng hoặc giọng nói.",
  },
  {
    type: "product", product: "internet", difficulty: "easy",
    question: "Internet tốc độ cao mang lại lợi ích gì cho học tập và làm việc?",
    options: ["Học/họp trực tuyến mượt, tải tài liệu nhanh", "Làm máy tính nhanh hỏng", "Tăng tiền điện gấp đôi", "Không có lợi ích gì"],
    correctIndex: 0,
    explanation: "Đường truyền nhanh, ổn định giúp học online, họp video và làm việc từ xa không gián đoạn.",
  },
  {
    type: "product", product: "camera", difficulty: "medium",
    question: "Tính năng nào giúp camera ghi hình rõ trong bóng tối?",
    options: ["Hồng ngoại (quay đêm)", "Loa ngoài", "Cổng sạc nhanh", "Màn hình cảm ứng"],
    correctIndex: 0,
    explanation: "Đèn hồng ngoại giúp camera quan sát được trong điều kiện thiếu sáng.",
  },
  {
    type: "product", product: "smarthome", difficulty: "medium",
    question: "“Kịch bản” (scene) trong Smart Home là gì?",
    options: ["Nhiều thiết bị tự động hoạt động theo một lệnh/điều kiện", "Một bộ phim trên TV", "Hóa đơn tiền điện", "Mật khẩu WiFi"],
    correctIndex: 0,
    explanation: "Ví dụ kịch bản “Về nhà”: mở cửa là đèn sáng, rèm mở, điều hòa bật — chỉ bằng một thao tác.",
  },
  {
    type: "product", product: "fptplay", difficulty: "medium",
    question: "Để xem FPT Play trên Smart TV, khách hàng thường cần gì?",
    options: ["Kết nối Internet và ứng dụng/thiết bị FPT Play", "Ăng-ten parabol", "Đầu đĩa DVD", "Máy phát điện"],
    correctIndex: 0,
    explanation: "FPT Play hoạt động qua Internet, xem trên ứng dụng Smart TV, điện thoại hoặc thiết bị FPT Play Box.",
  },
  {
    type: "product", product: "wifi", difficulty: "hard",
    question: "Công nghệ Multi-Link Operation (MLO) nổi bật trên chuẩn WiFi nào?",
    options: ["WiFi 7", "WiFi 4", "WiFi 5", "Bluetooth 4.0"],
    correctIndex: 0,
    explanation: "MLO trên WiFi 7 cho phép thiết bị dùng đồng thời nhiều băng tần, giảm độ trễ và tăng độ ổn định.",
  },
  {
    type: "product", product: "internet", difficulty: "hard",
    question: "Chỉ số “ping” (độ trễ) thấp đặc biệt quan trọng với hoạt động nào?",
    options: ["Chơi game online và gọi video", "Đọc sách giấy", "Nghe radio FM", "Xem ảnh đã tải về"],
    correctIndex: 0,
    explanation: "Ping thấp giúp phản hồi tức thì — rất quan trọng khi chơi game online hoặc họp video.",
  },
];
