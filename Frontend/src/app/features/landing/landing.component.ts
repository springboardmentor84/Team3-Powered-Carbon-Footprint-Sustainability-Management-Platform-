import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  public stats = [
    { value: '85%', label: 'Net Carbon Reduction Rate' },
    { value: '2.5M', label: 'Activities Tracked & Calculated' },
    { value: '120+', label: 'Eco Communities & Organizations' },
    { value: '99%', label: 'User Satisfaction & Engagement' }
  ];

  public trackingCategories = [
    { name: 'Transportation', icon: 'bi-car-front', count: '8 Sub-types', desc: 'Commute, EVs, Flights, Buses & Transit' },
    { name: 'Electricity', icon: 'bi-lightning-charge', count: 'Grid vs Solar', desc: 'Home & Office Electrical Consumption' },
    { name: 'Cooking Fuel', icon: 'bi-fire', count: 'LPG / PNG / Biogas', desc: 'Stoves, Cylinders, and Heating' },
    { name: 'Food & Diet', icon: 'bi-egg-fried', count: 'Meal Footprint', desc: 'Dietary Impact, Beef, Veg & Vegan' },
    { name: 'Water Usage', icon: 'bi-droplet', count: 'Hot & Cold Water', desc: 'Laundry, Showers, and Conservation' },
    { name: 'Waste Mgmt', icon: 'bi-trash3', count: 'Plastics & E-Waste', desc: 'Recycling, Composting & Diverted Waste' },
    { name: 'Online Shopping', icon: 'bi-bag-check', count: 'Consumer Goods', desc: 'Apparel, Electronics & Shipping Impact' },
    { name: 'Travel & Air', icon: 'bi-airplane', count: 'Flights & Hotels', desc: 'Domestic & International Travel CO₂' },
    { name: 'Tree Plantation', icon: 'bi-tree', count: 'Carbon Sink', desc: 'Offsetting via Reforestation & Trees' },
    { name: 'Recycling Drive', icon: 'bi-recycle', count: 'Circular Economy', desc: 'Paper, Glass & Metal Offset Credits' },
    { name: 'Renewable Energy', icon: 'bi-sun', count: 'Green Power', desc: 'Rooftop Solar & Clean Energy Credits' }
  ];
}
