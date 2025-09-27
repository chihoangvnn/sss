export interface Address {
  id: string;
  name: string; // Tên người nhận
  phone: string;
  address: string; // Địa chỉ đầy đủ
  city: string; // Tỉnh/thành phố
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddAddressData {
  name: string;
  phone: string;
  address: string;
  city: string;
  isDefault?: boolean;
}