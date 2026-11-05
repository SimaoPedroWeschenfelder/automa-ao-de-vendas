import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seedCars} from './demo.js';
import {visibleCars,statusFor,preparationBlock,preparationSummary} from './ui-state.js';
test('estoque disponível omite vendidos e filtro vendido permite consultá-los',()=>{const cars=seedCars();assert.equal(visibleCars(cars).length,5);assert.equal(visibleCars(cars,{filter:'sold'}).length,1);assert.equal(visibleCars(cars,{query:'tcross'}).length,1)});
test('somente retorno real confirmado aparece como pronto para revisão',()=>{const cars=seedCars();assert.equal(visibleCars(cars,{filter:'ready'}).length,0);cars[1].realJob=true;assert.equal(visibleCars(cars,{filter:'ready'}).length,1);assert.equal(preparationSummary(cars).ready.length,1)});
test('pendências incluem falhas e cadastros anteriores que exigem revisão',()=>{const cars=seedCars();cars[0].status='error';cars[4].needsReview=true;assert.equal(visibleCars(cars,{filter:'attention'}).length,3);assert.equal(statusFor(cars[4]).tone,'attention')});
test('impede preparação de exemplos, vendidos, publicados e migrações sem revisão',()=>{const car={...seedCars()[0],demo:false};assert.equal(preparationBlock(car),'');for(const c of [{...car,demo:true},{...car,needsReview:true},{...car,status:'published'},{...car,status:'sold'}])assert.ok(preparationBlock(c));assert.equal(statusFor({...car,realJob:true,status:'preparing',progressAt:1},130000).tone,'attention')});
