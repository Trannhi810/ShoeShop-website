const products = [
  {
    id: 1,
    name: "Nike Air Force 1",
    price: 2200000,
    category: "Sneaker",
    image: "https://via.placeholder.com/250x180?text=Nike+Air+Force+1",
    description: "Giày sneaker phong cách trẻ trung, dễ phối đồ."
  },
  {
    id: 2,
    name: "Adidas Ultraboost",
    price: 3200000,
    category: "Running",
    image: "https://via.placeholder.com/250x180?text=Adidas+Ultraboost",
    description: "Giày chạy bộ êm ái, phù hợp tập luyện hằng ngày."
  },
  {
    id: 3,
    name: "Converse Classic",
    price: 1500000,
    category: "Casual",
    image: "https://via.placeholder.com/250x180?text=Converse+Classic",
    description: "Thiết kế cổ điển, phù hợp đi học và đi chơi."
  },
  {
    id: 4,
    name: "Puma RS-X",
    price: 2700000,
    category: "Sneaker",
    image: "https://via.placeholder.com/250x180?text=Puma+RS-X",
    description: "Kiểu dáng thể thao hiện đại, cá tính."
  },
  {
    id: 5,
    name: "New Balance 530",
    price: 2600000,
    category: "Sneaker",
    image: "https://via.placeholder.com/250x180?text=New+Balance+530",
    description: "Giày nhẹ, êm chân, hợp mặc hằng ngày."
  },
  {
    id: 6,
    name: "Vans Old Skool",
    price: 1800000,
    category: "Casual",
    image: "https://via.placeholder.com/250x180?text=Vans+Old+Skool",
    description: "Phong cách basic, dễ phối đồ."
  }
];

const defaultUsers = [
  {
    id: 1,
    fullName: "Admin",
    email: "admin@gmail.com",
    password: "123456",
    role: "admin"
  },
  {
    id: 2,
    fullName: "Staff",
    email: "staff@gmail.com",
    password: "123456",
    role: "staff"
  },
  {
    id: 3,
    fullName: "Customer",
    email: "customer@gmail.com",
    password: "123456",
    role: "customer"
  }
];

if (!localStorage.getItem("users")) {
  localStorage.setItem("users", JSON.stringify(defaultUsers));
}