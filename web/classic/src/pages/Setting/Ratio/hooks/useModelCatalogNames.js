/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import { useCallback, useEffect, useState } from 'react';
import { API, showError } from '../../../../helpers';

const addModelName = (names, value) => {
  const name = typeof value === 'string' ? value.trim() : '';
  if (name) {
    names.add(name);
  }
};

export const extractModelCatalogNames = (data) => {
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];
  const names = new Set();

  items.forEach((item) => {
    addModelName(names, item?.model_name);
    if (Array.isArray(item?.matched_models)) {
      item.matched_models.forEach((name) => addModelName(names, name));
    }
  });

  return Array.from(names).sort((a, b) => a.localeCompare(b));
};

export function useModelCatalogNames(t) {
  const [modelNames, setModelNames] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadModelNames = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/models/?page_size=10000');
      const { success, message, data } = res.data;
      if (success) {
        setModelNames(extractModelCatalogNames(data));
      } else {
        showError(message || t('获取模型管理列表失败'));
      }
    } catch (error) {
      console.error(t('获取模型管理列表失败:'), error);
      showError(t('获取模型管理列表失败'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadModelNames();
  }, [loadModelNames]);

  return {
    modelNames,
    loading,
    reload: loadModelNames,
  };
}
