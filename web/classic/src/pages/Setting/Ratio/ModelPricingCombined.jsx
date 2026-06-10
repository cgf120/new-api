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

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useState } from 'react';
import { Radio, RadioGroup, Space, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import ModelPricingEditor from './components/ModelPricingEditor';
import ModelRatioSettings from './ModelRatioSettings';
import { useModelCatalogNames } from './hooks/useModelCatalogNames';

const { Text } = Typography;

export default function ModelPricingCombined({ options, refresh }) {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState('visual');
  const [pricingScope, setPricingScope] = useState('catalog');
  const { modelNames: catalogModelNames, loading: catalogLoading } =
    useModelCatalogNames(t);

  const listDescription =
    pricingScope === 'catalog'
      ? catalogLoading
        ? t('正在加载模型管理列表...')
        : t(
            '默认只显示模型管理中的 {{count}} 个模型；未配置价格模型也只在这个范围内筛选。',
            { count: catalogModelNames.length },
          )
      : t('当前显示全部内置定价项和自定义价格项。');

  return (
    <div>
      <Space wrap style={{ marginTop: 12, marginBottom: 16 }}>
        <RadioGroup
          type='button'
          size='small'
          value={editMode}
          onChange={(e) => setEditMode(e.target.value)}
        >
          <Radio value='visual'>{t('可视化编辑')}</Radio>
          <Radio value='manual'>{t('手动编辑')}</Radio>
        </RadioGroup>
        {editMode === 'visual' ? (
          <>
            <RadioGroup
              type='button'
              size='small'
              value={pricingScope}
              onChange={(e) => setPricingScope(e.target.value)}
            >
              <Radio value='catalog'>{t('模型管理模型')}</Radio>
              <Radio value='all'>{t('全部定价项')}</Radio>
            </RadioGroup>
            <Text type='tertiary' size='small'>
              {pricingScope === 'catalog'
                ? t('已隐藏未纳入模型管理的内置定价项')
                : t('用于查看和维护完整底层价格字典')}
            </Text>
          </>
        ) : null}
      </Space>
      {editMode === 'visual' ? (
        <ModelPricingEditor
          options={options}
          refresh={refresh}
          candidateModelNames={catalogModelNames}
          filterMode={pricingScope === 'catalog' ? 'candidate' : 'all'}
          listDescription={listDescription}
          emptyTitle={t('暂无模型管理模型')}
          emptyDescription={t(
            '请先在模型管理中添加模型，或切换到全部定价项查看底层配置。',
          )}
        />
      ) : (
        <ModelRatioSettings options={options} refresh={refresh} />
      )}
    </div>
  );
}
