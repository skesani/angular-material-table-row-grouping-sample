import {Component, OnInit, ViewChild} from '@angular/core';
import {MatSort, MatTableDataSource} from '@angular/material';

import {CarTableDataService} from './car-table-data.service';

export class Group {
	level = 0;
	expanded = false;
	totalCounts = 0;
}

export class Car {
	id: string = '';
	vin: string = '';
	brand: string = '';
	year: string = '';
	color: string = '';
}

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

	public dataSource = new MatTableDataSource<any | Group>([]);

	columns: any[];
	displayedColumns: string[];
	groupByColumns: string[] = [];
	allData: any[];
	_allGroup: any[];

	expandedCar: any[] = [];
	expandedSubCar: Car[] = [];

	@ViewChild(MatSort) sort: MatSort;

	constructor(
		protected dataSourceService: CarTableDataService,
	) {

		this.columns = [{
			field: 'id'
		}, {
			field: 'vin'
		}, {
			field: 'brand'
		}, {
			field: 'year'
		}, {
			field: 'color'
		}];
		this.displayedColumns = this.columns.map(column => column.field);
		this.groupByColumns = ['brand'];

	}

	ngOnInit() {
		this.dataSourceService.getAllData()
			.subscribe(
				(data: any) => {
					data.data.forEach((item, index) => {
						item.id = index + 1;
					});
					this.allData = data.data;
					this.dataSource.data = this.getGroups(this.allData, this.groupByColumns);
				},
				(err: any) => console.log(err)
			);
	}

	groupHeaderClick(row) {
		if (row.expanded) {
			row.expanded = false;
			this.dataSource.data = this.getGroups(this.allData, this.groupByColumns);
		} else {
			row.expanded = true;
			this.expandedCar = row;
			this.dataSource.data = this.addGroupsNew(this._allGroup, this.allData, this.groupByColumns, row);
		}
	}

	getGroups(data: any[], groupByColumns: string[]): any[] {
		const rootGroup = new Group();
		rootGroup.expanded = false;
		return this.getGroupList(data, 0, groupByColumns, rootGroup);
	}

	getGroupList(data: any[], level: number = 0, groupByColumns: string[], parent: Group): any[] {
		if (level >= groupByColumns.length) {
			return data;
		}
		let groups = this.uniqueBy(
			data.map(
				row => {
					const result = new Group();
					result.level = level + 1;
					for (let i = 0; i <= level; i++) {
						result[groupByColumns[i]] = row[groupByColumns[i]];
					}
					return result;
				}
			),
			JSON.stringify);

		const currentColumn = groupByColumns[level];
		let subGroups = [];
		groups.forEach(group => {
			const rowsInGroup = data.filter(row => group[currentColumn] === row[currentColumn]);
			group.totalCounts = rowsInGroup.length;
			this.expandedSubCar = [];
		});
		groups = groups.sort((a: Car, b: Car) => {
			const isAsc = 'asc';
			return this.compare(a.brand, b.brand, isAsc);

		});
		this._allGroup = groups;
		return groups;
	}

	addGroupsNew(allGroup: any[], data: any[], groupByColumns: string[], dataRow: any): any[] {
		const rootGroup = new Group();
		rootGroup.expanded = true;
		return this.getSublevelNew(allGroup, data, 0, groupByColumns, rootGroup, dataRow);
	}

	getSublevelNew(allGroup: any[], data: any[], level: number, groupByColumns: string[], parent: Group, dataRow: any): any[] {
		if (level >= groupByColumns.length) {
			return data;
		}
		const currentColumn = groupByColumns[level];
		let subGroups = [];
		allGroup.forEach(group => {
			const rowsInGroup = data.filter(row => group[currentColumn] === row[currentColumn]);
			group.totalCounts = rowsInGroup.length;

			if (group.brand == dataRow.brand.toString()) {
				group.expanded = dataRow.expanded;
				const subGroup = this.getSublevelNew(allGroup, rowsInGroup, level + 1, groupByColumns, group, dataRow.brand.toString());
				this.expandedSubCar = subGroup;
				subGroup.unshift(group);
				subGroups = subGroups.concat(subGroup);
			} else {
				subGroups = subGroups.concat(group);
			}
		});
		return subGroups;
	}

	uniqueBy(a, key) {
		const seen = {};
		return a.filter((item) => {
			const k = key(item);
			return seen.hasOwnProperty(k) ? false : (seen[k] = true);
		});
	}

	isGroup(index, item): boolean {
		return item.level;
	}

	onSortData(sort: MatSort) {
		let data = this.allData;
		const index = data.findIndex(x => x['level'] == 1);
		if (sort.active && sort.direction !== '') {
			if (index > -1) {
				data.splice(index, 1);
			}

			data = data.sort((a: Car, b: Car) => {
				const isAsc = sort.direction === 'asc';
				switch (sort.active) {
					case 'id':
						return this.compare(a.id, b.id, isAsc);
					case 'vin':
						return this.compare(a.vin, b.vin, isAsc);
					case 'brand':
						return this.compare(a.brand, b.brand, isAsc);
					case 'year':
						return this.compare(a.year, b.year, isAsc);
					case 'color':
						return this.compare(a.color, b.color, isAsc);
					default:
						return 0;
				}
			});
		}
		this.dataSource.data = this.addGroupsNew(this._allGroup, data, this.groupByColumns, this.expandedCar);
	}

	private compare(a, b, isAsc) {
		return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
	}
}