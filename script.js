// ====== Game Pikachu đơn giản ======

var HANG = 9;        // số hàng
var COT = 16;        // số cột
var SO_LOAI = 36;    // số loại hình (img/1.png ... img/36.png)
var DA = -1;         // số -1 nghĩa là ô đá

var moTaLevel = [
  "",
  "Level 1: Pikachu bình thường.",
  "Level 2: Mỗi lần nối được 1 cặp, các hình dồn sang trái, rồi lần sau dồn sang phải (xen kẽ).",
  "Level 3: Giống level 2 và có thêm ĐÁ chặn đường (đá đứng yên).",
  "Level 4: Giống level 3 và mỗi lần nối được 1 cặp thì XÁO TRỘN các hình còn lại.",
  "Level 5: Giống level 4, nhưng chỉ 50% ô hiện, 50% ô ẩn, cứ 3 giây đổi qua lại."
];

var level = 1;
var diem = 0;
var soCap = 0;       // đã nối được bao nhiêu cặp
var luoi = [];       // bảng chơi, 0 là ô trống
var chon = null;     // ô đang chọn
var pha = 0;         // level 5: đang hiện nhóm ô nào (0 hoặc 1)
var dongHo = null;   // đồng hồ đổi ô hiện/ẩn (level 5)
var dongHoGio = null; // đồng hồ đếm ngược
var xong = false;

// thời gian giới hạn mỗi level (giây)
var gioiHan = [0, 600, 540, 480, 420, 420];
var conGio = 0;      // số giây còn lại
var luotGoiY = 3;    // số lượt gợi ý
var goiY = null;     // 2 ô đang được gợi ý

// ====== Hàm phụ ======

function xaoMang(mang) {
  for (var i = mang.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tam = mang[i];
    mang[i] = mang[j];
    mang[j] = tam;
  }
}

// level 5: ô (r,c) có đang hiện không?
function dangHien(r, c) {
  if (level < 5) return true;
  return (r + c) % 2 == pha;
}

// ====== Bắt đầu chơi ======

function batDau(lv) {
  level = lv;
  diem = 0;
  soCap = 0;
  chon = null;
  pha = 0;
  xong = false;
  goiY = null;
  luotGoiY = 3;
  conGio = gioiHan[level];
  clearInterval(dongHo);
  clearInterval(dongHoGio);

  // tạo bảng trống (có thêm 1 vòng viền để đường nối đi vòng ngoài)
  luoi = [];
  for (var r = 0; r <= HANG + 1; r++) {
    luoi[r] = [];
    for (var c = 0; c <= COT + 1; c++) luoi[r][c] = 0;
  }

  // danh sách tất cả các ô
  var cacO = [];
  for (var r = 1; r <= HANG; r++) {
    for (var c = 1; c <= COT; c++) cacO.push([r, c]);
  }
  xaoMang(cacO);

  // level 3 trở lên: đặt đá
  var soDa = 0;
  if (level >= 3) soDa = 14;
  for (var i = 0; i < soDa; i++) {
    luoi[cacO[i][0]][cacO[i][1]] = DA;
  }

  // các ô còn lại: tạo hình theo cặp
  var hinh = [];
  var soO = cacO.length - soDa;
  for (var i = 0; i < soO / 2; i++) {
    var loai = i % SO_LOAI + 1;
    hinh.push(loai);
    hinh.push(loai);
  }
  xaoMang(hinh);
  for (var i = 0; i < soO; i++) {
    var o = cacO[soDa + i];
    luoi[o[0]][o[1]] = hinh[i];
  }

  // đảm bảo có nước đi
  xaoTron(false);

  // level 5: cứ 3 giây đổi nhóm ô hiện
  if (level == 5) {
    dongHo = setInterval(function () {
      pha = 1 - pha;   // đổi nhóm ô hiện (ô đang chọn vẫn được giữ)
      veBang();
    }, 3000);
  }

  // đồng hồ đếm ngược
  dongHoGio = setInterval(function () {
    if (xong) return;
    conGio--;
    veGio();
    if (conGio <= 0) {
      xong = true;
      clearInterval(dongHo);
      clearInterval(dongHoGio);
      document.getElementById("thongBao").innerText = "⏰ Hết giờ! Bấm 'Chơi lại' để thử lại nhé.";
    }
  }, 1000);

  document.getElementById("moTa").innerText = moTaLevel[level];
  document.getElementById("thongBao").innerText = "Chọn hai hình giống nhau để nối!";
  var nut = document.querySelectorAll(".levels button");
  for (var i = 0; i < nut.length; i++) {
    nut[i].className = (i + 1 == level) ? "chon" : "";
  }
  veBang();
}

// ====== Vẽ bảng ======

function veBang() {
  var html = "";
  var conLai = 0;
  for (var r = 1; r <= HANG; r++) {
    for (var c = 1; c <= COT; c++) {
      var v = luoi[r][c];
      if (v == 0) {
        html += "<div class='o trong'></div>";
      } else if (v == DA) {
        html += "<div class='o da'>🪨</div>";
      } else {
        conLai++;
        if (!dangHien(r, c)) {
          var lopAn = "o an";
          if (chon != null && chon[0] == r && chon[1] == c) lopAn = "o an chon";
          if (laGoiY(r, c)) lopAn += " goiy";
          html += "<div class='" + lopAn + "'>?</div>";
        } else {
          var lop = "o";
          if (chon != null && chon[0] == r && chon[1] == c) lop = "o chon";
          if (laGoiY(r, c)) lop += " goiy";
          html += "<div class='" + lop + "' onclick='bamO(" + r + "," + c + ")'>" +
                  "<img src='img/" + v + ".png'></div>";
        }
      }
    }
  }
  document.getElementById("bang").innerHTML = html;
  document.getElementById("diem").innerText = diem;
  document.getElementById("conLai").innerText = conLai;
  document.getElementById("nutGoiY").innerText = "💡 Gợi ý (" + luotGoiY + ")";
  veGio();
}

// hiện thời gian còn lại dạng mm:ss
function veGio() {
  var giay = Math.max(conGio, 0);
  var p = Math.floor(giay / 60);
  var g = giay % 60;
  if (g < 10) g = "0" + g;
  var o = document.getElementById("gio");
  o.innerText = p + ":" + g;
  o.style.color = (giay <= 30) ? "red" : "black";
}

// ô (r,c) có đang được gợi ý không?
function laGoiY(r, c) {
  if (goiY == null) return false;
  for (var i = 0; i < goiY.length; i++) {
    if (goiY[i][0] == r && goiY[i][1] == c) return true;
  }
  return false;
}

// ====== Kiểm tra đường nối ======

// đường thẳng giữa 2 điểm (cùng hàng hoặc cùng cột) có trống không? (không tính 2 đầu)
function thang(r1, c1, r2, c2) {
  if (r1 == r2) {
    for (var c = Math.min(c1, c2) + 1; c < Math.max(c1, c2); c++) {
      if (luoi[r1][c] != 0) return false;
    }
    return true;
  }
  if (c1 == c2) {
    for (var r = Math.min(r1, r2) + 1; r < Math.max(r1, r2); r++) {
      if (luoi[r][c1] != 0) return false;
    }
    return true;
  }
  return false;
}

// 2 ô có nối được không? (tối đa 2 góc rẽ)
function noiDuoc(r1, c1, r2, c2) {
  // 1. đường thẳng
  if (thang(r1, c1, r2, c2)) return true;

  // 2. một góc rẽ
  if (luoi[r1][c2] == 0 && thang(r1, c1, r1, c2) && thang(r1, c2, r2, c2)) return true;
  if (luoi[r2][c1] == 0 && thang(r1, c1, r2, c1) && thang(r2, c1, r2, c2)) return true;

  // 3. hai góc rẽ: đi ngang - dọc - ngang
  for (var c = 0; c <= COT + 1; c++) {
    if (luoi[r1][c] == 0 && luoi[r2][c] == 0 &&
        thang(r1, c1, r1, c) && thang(r1, c, r2, c) && thang(r2, c, r2, c2)) return true;
  }
  // hai góc rẽ: đi dọc - ngang - dọc
  for (var r = 0; r <= HANG + 1; r++) {
    if (luoi[r][c1] == 0 && luoi[r][c2] == 0 &&
        thang(r1, c1, r, c1) && thang(r, c1, r, c2) && thang(r, c2, r2, c2)) return true;
  }
  return false;
}

// tìm 1 cặp nối được, không có thì trả về null
function timCap() {
  var ds = [];
  for (var r = 1; r <= HANG; r++) {
    for (var c = 1; c <= COT; c++) {
      if (luoi[r][c] > 0) ds.push([r, c]);
    }
  }
  for (var i = 0; i < ds.length; i++) {
    for (var j = i + 1; j < ds.length; j++) {
      var a = ds[i], b = ds[j];
      if (luoi[a[0]][a[1]] == luoi[b[0]][b[1]] && noiDuoc(a[0], a[1], b[0], b[1])) return [a, b];
    }
  }
  return null;
}

// còn nước đi nào không?
function conNuocDi() {
  return timCap() != null;
}

// ====== Nút gợi ý ======

function goiYNhe() {
  if (xong) return;
  if (luotGoiY <= 0) {
    document.getElementById("thongBao").innerText = "Bạn đã hết lượt gợi ý!";
    return;
  }
  var cap = timCap();
  if (cap == null) return;
  luotGoiY--;
  goiY = cap;
  document.getElementById("thongBao").innerText = "Gợi ý: hai ô viền xanh có thể nối với nhau.";
  veBang();
}

// ====== Click vào ô ======

function bamO(r, c) {
  if (xong) return;
  goiY = null;
  if (luoi[r][c] <= 0) return;
  if (!dangHien(r, c)) return;

  // chưa chọn ô nào
  if (chon == null) {
    chon = [r, c];
    veBang();
    return;
  }

  // bấm lại ô đã chọn -> bỏ chọn
  if (chon[0] == r && chon[1] == c) {
    chon = null;
    veBang();
    return;
  }

  var r1 = chon[0], c1 = chon[1];
  if (luoi[r1][c1] == luoi[r][c] && noiDuoc(r1, c1, r, c)) {
    // nối được!
    luoi[r1][c1] = 0;
    luoi[r][c] = 0;
    chon = null;
    diem += 10;
    soCap++;
    var tb = "Đúng rồi! +10 điểm";

    // level 2 trở lên: dồn trái / phải xen kẽ
    if (level >= 2) {
      if (soCap % 2 == 1) {
        dichChuyen(true);
        tb += " — các hình dồn sang TRÁI";
      } else {
        dichChuyen(false);
        tb += " — các hình dồn sang PHẢI";
      }
    }

    // level 4 trở lên: xáo trộn
    if (level >= 4) {
      tb += " — đã xáo trộn!";
    }

    // kiểm tra thắng, và đảm bảo còn nước đi
    if (conLaiBao() == 0) {
      veBang();
      xong = true;
      clearInterval(dongHo);
      clearInterval(dongHoGio);
      document.getElementById("thongBao").innerText = "🎉 Chiến thắng! Bạn được " + diem + " điểm.";
      return;
    }
    if (level >= 4) xaoTron(true); // level 4,5: luôn xáo trộn
    else xaoTron(false);           // level khác: chỉ xáo khi hết nước đi
    document.getElementById("thongBao").innerText = tb;
  } else {
    // sai -> chọn ô mới
    chon = [r, c];
    if (luoi[r1][c1] != luoi[r][c]) document.getElementById("thongBao").innerText = "Hai hình không giống nhau.";
    else document.getElementById("thongBao").innerText = "Chưa nối được (tối đa 2 góc rẽ, không xuyên qua ô khác).";
  }
  veBang();
}

// đếm số hình còn lại
function conLaiBao() {
  var dem = 0;
  for (var r = 1; r <= HANG; r++) {
    for (var c = 1; c <= COT; c++) {
      if (luoi[r][c] > 0) dem++;
    }
  }
  return dem;
}

// ====== Dồn các hình sang trái / phải (đá đứng yên) ======

function dichChuyen(sangTrai) {
  for (var r = 1; r <= HANG; r++) {
    var cacCot = [];   // các cột không phải đá
    var hinh = [];     // các hình trong hàng
    for (var c = 1; c <= COT; c++) {
      if (luoi[r][c] != DA) {
        cacCot.push(c);
        if (luoi[r][c] > 0) hinh.push(luoi[r][c]);
        luoi[r][c] = 0;
      }
    }
    for (var i = 0; i < hinh.length; i++) {
      if (sangTrai) luoi[r][cacCot[i]] = hinh[i];
      else luoi[r][cacCot[cacCot.length - hinh.length + i]] = hinh[i];
    }
  }
}

// ====== Xáo trộn ======
// luonXao = true: xáo ít nhất 1 lần; false: chỉ xáo khi hết nước đi

function xaoTron(luonXao) {
  if (luonXao == false && conNuocDi()) return;
  var viTri = [];
  var hinh = [];
  for (var r = 1; r <= HANG; r++) {
    for (var c = 1; c <= COT; c++) {
      if (luoi[r][c] > 0) {
        viTri.push([r, c]);
        hinh.push(luoi[r][c]);
      }
    }
  }
  for (var lan = 0; lan < 200; lan++) {
    xaoMang(hinh);
    for (var i = 0; i < viTri.length; i++) {
      luoi[viTri[i][0]][viTri[i][1]] = hinh[i];
    }
    if (conNuocDi()) return;
  }
}

batDau(1);
