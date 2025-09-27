'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Edit, Trash2, Star, Phone, User, MapIcon, ArrowLeft } from 'lucide-react';
import { Address, AddAddressData } from '@/types/address';
import { AddressStorage } from '@/utils/addressStorage';

interface AddressManagementProps {
  onBack?: () => void;
}

export function AddressManagement({ onBack }: AddressManagementProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<AddAddressData>({
    name: '',
    phone: '',
    address: '',
    isDefault: false,
  });

  // Load addresses on component mount
  useEffect(() => {
    setAddresses(AddressStorage.getAddresses());
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      isDefault: false,
    });
    setEditingAddress(null);
    setShowAddForm(false);
  };

  const handleAddAddress = () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    try {
      if (editingAddress) {
        // Update existing address
        const updated = AddressStorage.updateAddress(editingAddress.id, formData);
        if (updated) {
          setAddresses(AddressStorage.getAddresses());
        }
      } else {
        // Add new address
        AddressStorage.addAddress(formData);
        setAddresses(AddressStorage.getAddresses());
      }
      
      resetForm();
      alert(editingAddress ? 'Đã cập nhật địa chỉ!' : 'Đã thêm địa chỉ mới!');
    } catch (error) {
      console.error('Failed to save address:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name || '',
      phone: address.phone || '',
      address: address.address || '',
      isDefault: address.isDefault || false,
    });
    setShowAddForm(true);
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      if (AddressStorage.deleteAddress(id)) {
        setAddresses(AddressStorage.getAddresses());
        alert('Đã xóa địa chỉ!');
      }
    }
  };

  const handleSetDefault = (id: string) => {
    if (AddressStorage.setDefaultAddress(id)) {
      setAddresses(AddressStorage.getAddresses());
    }
  };

  // Show add/edit form
  if (showAddForm) {
    return (
      <div className="p-4 pt-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={resetForm}
            className="p-2 mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">
            {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h1>
        </div>

        {/* Add/Edit Form */}
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên người nhận *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Nhập tên người nhận"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ đầy đủ *
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
              Đặt làm địa chỉ mặc định
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={resetForm}
              variant="outline"
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleAddAddress}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show addresses list
  return (
    <div className="p-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="p-2 mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-semibold text-gray-900">Thông tin giao hàng</h1>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm địa chỉ
        </Button>
      </div>

      {/* Addresses List */}
      <div className="space-y-4">
        {addresses.length > 0 ? (
          addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white rounded-xl p-4 border-2 transition-all ${
                address.isDefault 
                  ? 'border-green-200 bg-green-50/50' 
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* Address Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold text-gray-900">{address.name}</span>
                  </div>
                  {address.isDefault && (
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Mặc định
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditAddress(address)}
                    className="p-2"
                  >
                    <Edit className="h-4 w-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAddress(address.id)}
                    className="p-2"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex items-center space-x-1 mb-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{address.phone}</span>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-1 mb-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-gray-700">
                  <div>{address.address}</div>
                </div>
              </div>

              {/* Set Default Button */}
              {!address.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetDefault(address.id)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Star className="h-4 w-4 mr-1" />
                  Đặt làm mặc định
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <MapIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Chưa có địa chỉ</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Thêm địa chỉ giao hàng để đặt hàng nhanh chóng và thuận tiện hơn.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm địa chỉ đầu tiên
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}