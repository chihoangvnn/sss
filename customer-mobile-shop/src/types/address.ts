export interface Address {
  id: string;
  name: string; // Tên người nhận
  phone: string;
  address: string; // Địa chỉ đầy đủ (bao gồm cả tỉnh/thành phố)
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddAddressData {
  name: string;
  phone: string;
  address: string;
  isDefault?: boolean;
}