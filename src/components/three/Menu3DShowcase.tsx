import React from 'react';
import { MenuItem } from '../../data/cafeConfig';
import { FoodViewer } from './FoodViewer';

export interface Menu3DShowcaseProps {
  dish: MenuItem;
}

export const Menu3DShowcase: React.FC<Menu3DShowcaseProps> = ({ dish }) => {
  return <FoodViewer dish={dish} />;
};
