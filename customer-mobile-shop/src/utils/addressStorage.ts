import { Address, AddAddressData } from '@/types/address';

const ADDRESSES_KEY = 'user_addresses';

export class AddressStorage {
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static getAddresses(): Address[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(ADDRESSES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get addresses:', error);
      return [];
    }
  }

  static saveAddresses(addresses: Address[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addresses));
    } catch (error) {
      console.error('Failed to save addresses:', error);
    }
  }

  static addAddress(data: AddAddressData): Address {
    const addresses = this.getAddresses();
    
    // If this is set as default, unset other defaults
    if (data.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }
    
    // If this is the first address, make it default
    const isFirstAddress = addresses.length === 0;
    
    const newAddress: Address = {
      id: this.generateId(),
      ...data,
      isDefault: data.isDefault || isFirstAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addresses.push(newAddress);
    this.saveAddresses(addresses);
    
    return newAddress;
  }

  static updateAddress(id: string, data: Partial<AddAddressData>): Address | null {
    const addresses = this.getAddresses();
    const index = addresses.findIndex(addr => addr.id === id);
    
    if (index === -1) return null;
    
    // If setting as default, unset others
    if (data.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }
    
    addresses[index] = {
      ...addresses[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    this.saveAddresses(addresses);
    return addresses[index];
  }

  static deleteAddress(id: string): boolean {
    const addresses = this.getAddresses();
    const filteredAddresses = addresses.filter(addr => addr.id !== id);
    
    if (filteredAddresses.length === addresses.length) {
      return false; // Address not found
    }
    
    // If we deleted the default address, make the first remaining address default
    const deletedAddress = addresses.find(addr => addr.id === id);
    if (deletedAddress?.isDefault && filteredAddresses.length > 0) {
      filteredAddresses[0].isDefault = true;
    }
    
    this.saveAddresses(filteredAddresses);
    return true;
  }

  static setDefaultAddress(id: string): boolean {
    const addresses = this.getAddresses();
    const targetAddress = addresses.find(addr => addr.id === id);
    
    if (!targetAddress) return false;
    
    // Unset all defaults and set the target as default
    addresses.forEach(addr => {
      addr.isDefault = addr.id === id;
      if (addr.id === id) {
        addr.updatedAt = new Date().toISOString();
      }
    });
    
    this.saveAddresses(addresses);
    return true;
  }

  static getDefaultAddress(): Address | null {
    const addresses = this.getAddresses();
    return addresses.find(addr => addr.isDefault) || addresses[0] || null;
  }
}