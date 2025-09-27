export interface Address {
  id: string;
  name: string; // Tên người nhận
  phone: string;
  address: string; // Địa chỉ chi tiết
  ward: string; // Phường/xã
  district: string; // Quận/huyện
  city: string; // Tỉnh/thành phố
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddAddressData {
  name: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault?: boolean;
}