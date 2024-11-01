// Copyright (c) 2023, efeone and contributors
// For license information, please see license.txt

frappe.ui.form.on('Jewellery Invoice', {
  setup: function(frm) {
    set_filters(frm);
  },
  transaction_date: function(frm) {
    if (frm.doc.transaction_date ) {
      frm.doc.items.forEach((child) => {
        set_item_details(frm, child);
      });
    }
  },
  customer: function(frm) {
    //method for setting the customer type
    if (frm.doc.customer) {
      frappe.call({
        method : 'aumms.aumms.doc_events.sales_order.set_customer_type',
        args : {
          customer: frm.doc.customer
        },
        callback : function(r) {
          if (r.message) {
            if(frm.doc.items){
              frm.doc.items.forEach((child) => {
                child.customer_type = r.message
              });
            }
          }
        }
      })
    }
  },
  // validate: function(frm){
  //   set_totals(frm);
  // },
    
   // edit by aj

  // disable_rounded_total: function(frm){
  //   if(frm.doc.disable_rounded_total){
  //     frm.set_value('rounding_adjustment', 0);
  //   }
  //   else{
  //     frm.set_value('rounded_total', Math.round(frm.doc.grand_total));
  //     frm.set_value('rounding_adjustment', frm.doc.rounded_total - frm.doc.grand_total);
  //   }
  //   frm.set_value('rounded_total', frm.doc.grand_total+frm.doc.rounding_adjustment);
  // },
  delivery_date: function(frm){
    if(frm.doc.delivery_date){
      set_missing_delivery_dates(frm);
    }
  },
  refresh: function(frm){
    if(frm.doc.docstatus===1){
      create_custom_buttons(frm);
    }
  },
  onload_post_render: function(frm){
    remove_previous_links(frm);
  },
  transaction_type: function(frm){
    set_net_weight_and_amount(frm);
  },
  sales_taxes_and_charges_template: function(frm) {
    if (frm.doc.sales_taxes_and_charges_template) {
        frappe.call({
            method: 'aumms.aumms.doctype.jewellery_invoice.jewellery_invoice.get_sales_taxes_and_charges_details',
            args: {
                sales_taxes_and_charges_template: frm.doc.sales_taxes_and_charges_template,
                total_gold_amount : frm.doc.total_gold_amount,
                jewellery_invoice: frm.doc.name
            },
            callback: function(response) {
                if (response.message) {
                    frm.clear_table("custom_sales_taxes_and_charges");
                    var total_taxes_and_charges = 0
                    response.message.forEach(function(tax) {
                        frm.add_child("custom_sales_taxes_and_charges", {
                            charge_type: tax.charge_type,
                            account_head: tax.account_head,
                            description: tax.description,
                            rate: tax.rate,
                            tax_amount: tax.tax_amount,
                            included_in_print_rate: tax.included_in_print_rate,
                            total : tax.total
                        });
                        total_taxes_and_charges += tax.tax_amount
                    });
                    frm.set_value('custom_total_taxes_and_charges', total_taxes_and_charges)
                    frm.refresh_field('custom_total_taxes_and_charges');
                    frm.refresh_field("custom_sales_taxes_and_charges");
                }
            }
        });
    }
}
});

//  edited by aj
frappe.ui.form.on('Old Jewellery Item', {
  item_code: function(frm, cdt, cdn) {
    let d = locals[cdt][cdn];
    
    if (d.item_code && d.purity && d.stock_uom) {
    
      frappe.call({
        method: 'aumms.aumms.utils.get_board_rate',
        args: {
            'item_type': d.item_type,
            'date': frm.doc.transaction_date,
            'purity': d.purity,
            'stock_uom': d.stock_uom
        },
        callback: function(r) {
          if (r.message) {
            let board_rate = r.message
            frappe.model.set_value(cdt, cdn, 'board_rate', board_rate);
            frappe.model.set_value(cdt, cdn, 'rate', board_rate)
            frm.refresh_field('old_jewellery_items');
          }
        }
      });
    }
  },
  weight: function(frm, cdt, cdn){
    let d = locals[cdt][cdn];
    let total_old_gold_weight;
    if (d.weight){
      frappe.model.set_value(cdt, cdn, 'amount', d.weight * d.rate);
      frm.refresh_field('old_jewellery_items');
      if(frm.doc.total_old_gold_weight){
        total_old_gold_weight = frm.doc.total_old_gold_weight
      }
      total_old_gold_weight = total_old_gold_weight + d.weight;
      frm.set_value('total_old_gold_weight', total_old_gold_weight);
    }
  },
  rate: function(frm, cdt, cdn){
    let d = locals[cdt][cdn];
    if (d.rate){
      //set amount with rate * weight
      frappe.model.set_value(cdt, cdn, 'amount', d.weight * d.rate);
      frm.refresh_field('old_jewellery_items');
    }
  },
  amount: function(frm){
    set_net_weight_and_amount(frm);
  },
  old_jewellery_items_add: function(frm){
    set_net_weight_and_amount(frm);
  },
  old_jewellery_items_remove: function(frm){
    set_net_weight_and_amount(frm);
  }
});

//  aj

frappe.ui.form.on('Jewellery Invoice Item', {
//  item_code: function(frm, cdt, cdn){
//   console.log("here-1");
//   let d = locals[cdt][cdn];
//     if (d.item_code){
//       if(frm.doc.delivery_date){
//         frappe.model.set_value(d.doctype, d.name, 'delivery_date', frm.doc.delivery_date);
//       }
//       if (d.is_purity_item){
//         frappe.call({
//           // Method for fetching  gold_weight, making_charge_percentage, making_charge & board_rate
//           method: 'aumms.aumms.doc_events.sales_order.get_item_details',
//           args: {
//             'item_code': d.item_code,
//             'item_type': d.item_type,
//             'date': frm.doc.transaction_date,
//             'purity': d.purity,
//             'stock_uom': d.stock_uom
//           },
//           callback: function(r) {
//             if (r.message){
//               frappe.model.set_value(d.doctype, d.name, 'gold_weight', r.message['gold_weight']);
//               frappe.model.set_value(d.doctype, d.name, 'stone_weight', r.message['stone_weight']);
//               frappe.model.set_value(d.doctype, d.name, 'net_weight', r.message['net_weight']);
//               frappe.model.set_value(d.doctype, d.name, 'stone_charge', r.message['stone_charge']);
//               frappe.model.set_value(d.doctype, d.name, 'making_charge_percentage', r.message['making_charge_percentage']);
//               frappe.model.set_value(d.doctype, d.name, 'is_fixed_making_charge', r.message['making_charge']);
//               frappe.model.set_value(d.doctype, d.name, 'board_rate', r.message['board_rate']);
//               frappe.model.set_value(d.doctype, d.name, 'making_charge_based_on', r.message['making_charge_based_on']);
//               frappe.model.set_value(d.doctype, d.name, 'making_charge_percentage', r.message['making_charge_percentage']);
//               frappe.model.set_value(d.doctype, d.name, 'amount_with_out_making_charge', r.message['gold_weight'] * r.message['board_rate']);
//               frappe.model.set_value(d.doctype, d.name, 'net_amount_with_out_making_charge', (r.message['gold_weight'] * r.message['board_rate']) + r.message['stone_charge']);
//               if (r.message['making_charge']){
//                 frappe.model.set_value(d.doctype, d.name, 'making_charge', r.message['making_charge']);
//               }
//               else {
//                 //set making_charge if it's percentage
//                 frappe.model.set_value(d.doctype, d.name, 'making_charge', (d.amount_with_out_making_charge)*(d.making_charge_percentage * 0.01));
//               }
//               frappe.model.set_value(d.doctype, d.name, 'rate', (d.net_amount_with_out_making_charge + d.making_charge)/d.gold_weight);
//               frm.refresh_field('items');
//             }
//           }
//         })
//       }
//     }


    // code to fetch stone details aj
// },
  item_code: function(frm, cdt, cdn) {
    let d = locals[cdt][cdn];
    
    if (d.item_code) {
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "AuMMS Item",
                name: d.item_code  
            },
            callback: function(r) {
                if (r.message) {
                    let stone_details = r.message.stone_details;  
                    
                    $.each(stone_details, function(index, row) {
                        let child = frm.add_child('custom_stone_detail_');
                        child.item_code = d.item_code;
                        child.item_name = row.item_name;
                        child.stone_type = row.stone_type;
                        child.stone_weight = row.stone_weight;
                        child.stone_charge = row.stone_charge;
                    });

                    frm.refresh_field('custom_stone_detail_');
                }
            }
        });
    }
},
  // item_code: function(frm, cdt, cdn) {
  //   let d = locals[cdt][cdn];  
    
  //   if (d.item_code) {
  //     frappe.db.get_list('Stone Details', {
  //           fields: ['item_name', 'stone_type', 'stone_weight', 'stone_charge'],
  //           filters: {
  //               parent: d.item_code  
  //           }
  //       }).then(records => {
            
  //           records.forEach(record => {
                
  //               let child = frm.add_child('custom_stone_detail_');
  //               child.item_name = record.item_name;
  //               child.stone_type = record.stone_type;
  //               child.stone_weight = record.stone_weight;
  //               child.stone_charge = record.stone_charge;
  //           });

  //           frm.refresh_field('custom_stone_detail_');
  //       });
  //   }

  

  gold_weight: function(frm, cdt, cdn){
    let d = locals[cdt][cdn];
    let total_gold_weight;
    if (d.gold_weight){
      //set amount_with_out_making_charge while changing gold_weight
      frappe.model.set_value(d.doctype, d.name, 'amount_with_out_making_charge', d.gold_weight * d.board_rate);
      frappe.model.set_value(d.doctype, d.name, 'net_amount_with_out_making_charge', d.amount_with_out_making_charge + d.stone_charge);
      //set amount with rate * gold_weight
      frappe.model.set_value(d.doctype, d.name, 'amount', d.gold_weight * d.rate);
      frm.refresh_field('items');
      if(frm.doc.total_gold_weight){
        total_gold_weight = frm.doc.total_gold_weight
      }
      total_gold_weight = total_gold_weight + d.gold_weight;
      frm.set_value('total_gold_weight', total_gold_weight);
    }
  },
  rate: function(frm, cdt, cdn){
    let d = locals[cdt][cdn];
    if (d.rate){
      //set amount with rate * gold_weight
      frappe.model.set_value(d.doctype, d.name, 'amount', d.gold_weight * d.rate);
      frm.refresh_field('items');
    }
  },
  amount: function(frm, cdt, cdn) {
    set_net_weight_and_amount(frm);
    // set_totals(frm);
  },
  making_charge_percentage: function(frm, cdt, cdn){
    let d = locals[cdt][cdn];
    if (d.making_charge_percentage){
      var making_charge = d.amount_with_out_making_charge * d.making_charge_percentage * 0.01
      //set making_charge while changing of making_charge_percentage
      frappe.model.set_value(d.doctype, d.name, 'making_charge', making_charge);
    }
    frm.refresh_field('items')
  },
  amount_with_out_making_charge: function(frm, cdt, cdn){
    let d = locals[cdt][cdn];
    if (d.amount_with_out_making_charge){
      frappe.model.set_value(d.doctype, d.name, 'net_amount_with_out_making_charge', d.amount_with_out_making_charge + d.stone_charge);
      let making_charge = d.amount_with_out_making_charge * d.making_charge_percentage * 0.01
      frappe.model.set_value(d.doctype, d.name, 'making_charge', making_charge);//set making_charge while changing of amount_with_out_making_charge
      let rate = (d.net_amount_with_out_making_charge + d.making_charge)/d.gold_weight
      if (rate)
      {
        //set rate by the change of amount_with_out_making_charge
        frappe.model.set_value(d.doctype, d.name, 'rate', rate);
      }
    }
    frm.refresh_field('items');
  },
  net_amount_with_out_making_charge: function(frm, cdt, cdn){
    let d = locals[cdt][cdn];
    if(d.net_amount_with_out_making_charge){
      let rate = (d.net_amount_with_out_making_charge + d.making_charge)/d.gold_weight
      if (rate)
      {
        //set rate by the change of amount_with_out_making_charge
        frappe.model.set_value(d.doctype, d.name, 'rate', rate);
      }
    }
    frm.refresh_field('items');
  },
  making_charge:function(frm, cdt, cdn) {
    let d = locals[cdt][cdn];
    if(d.making_charge) {
      let rate = (d.net_amount_with_out_making_charge + d.making_charge)/d.gold_weight
      if (rate)
      {
        //set rate by the change of making_charge
        frappe.model.set_value(d.doctype, d.name, 'rate', rate);
        frm.refresh_field('items');
      }
    }
  },
  stone_charge:function(frm, cdt,cdn){
    let d = locals[cdt][cdn];
    if(d.stone_charge){
      frappe.model.set_value(d.doctype, d.name, 'net_amount_with_out_making_charge', d.amount_with_out_making_charge + d.stone_charge);
      frm.refresh_field('items');
    }
  },
  conversion_factor:function(frm, cdt,cdn){
    let d = locals[cdt][cdn];
    if(d.conversion_factor){
      var rate = d.board_rate * d.conversion_factor;
      //set rate by the change of conversion_factor
      frappe.model.set_value(d.doctype, d.name, 'rate', rate);
      frm.refresh_field('items');
    }
  },
  items_add: function(frm, cdt, cdn) {
    let child = locals[cdt][cdn]
    if(frm.doc.customer) {
      set_board_rate_read_only(frm, cdt, cdn);
    }
    if(frm.doc.delivery_date){
      frappe.model.set_value(child.doctype, child.name, 'delivery_date', frm.doc.delivery_date);
    }
    frm.refresh_field('items');
    // set_totals(frm);
    set_net_weight_and_amount(frm);
  },
  items_remove: function(frm, cdt, cdn) {
    // set_totals(frm);
    set_net_weight_and_amount(frm);
  }
});

let set_item_details = function(frm, child) {
  //function to get item get_item_details
  if(child.item_type){
    frappe.call({
        method : 'aumms.aumms.utils.get_board_rate',
        args: {
          item_type: child.item_type,
          date: frm.doc.transaction_date,
          stock_uom: child.stock_uom,
          purity: child.purity
        },
        callback : function(r) {
          if (r.message) {
            frappe.model.set_value(child.doctype, child.name, 'board_rate', r.message)
            frappe.model.set_value(child.doctype, child.name, 'amount_with_out_making_charge', (child.gold_weight * r.message))
            frappe.model.set_value(child.doctype, child.name, 'net_amount_with_out_making_charge', (child.amount_with_out_making_charge + child.stone_charge))
            frappe.model.set_value(child.doctype, child.name, 'rate', (child.net_amount_with_out_making_charge + child.making_charge)/child.gold_weight)
            frm.refresh_field('items');
          }
        }
    })
  }
}

let set_board_rate_read_only = function (frm, cdt, cdn) {
  //method for setting the customer type
  let child = locals[cdt][cdn]
    frappe.call({
        method : 'aumms.aumms.doc_events.sales_order.set_customer_type',
        args : {
          customer: frm.doc.customer
        },
        callback : function(r) {
          if (r.message) {
            child.customer_type = r.message
            frm.refresh_field('items');
          }
        }
    })
}

let set_filters = function(frm){
  frm.set_query('item_code', 'items', () => {
    return {
      filters: {
        disabled: 0,
        is_stone_item: 0
      }
    }
  });
  frm.set_query('stock_uom', 'items', () => {
    return {
      filters: {
        is_purity_uom: 1,
        enabled: 1
      }
    }
  });
  frm.set_query('item_code', 'old_jewellery_items', () => {
    return {
      filters: {
        disabled: 0,
        item_group: 'AuMMS Old Gold'
      }
    }
  });
}

// let set_totals = function(frm){
//   let total = 0;
//   if(frm.doc.items){
//     frm.doc.items.forEach((child) => {
//       if(child.amount){
//         total = total + child.amount;
//       }
//     });
//   }
//   frm.set_value('grand_total', total);
//   frm.set_value('rounded_total', total);
//   frm.refresh_fields();
// }

let set_net_weight_and_amount = function(frm) {
  let total_old_gold_weight = 0;
  let total_gold_weight = 0;
  let total_old_gold_amount = 0;
  let total_gold_amount = 0; 
  let balance_amount = 0;

  if (frm.doc.items) {
    frm.doc.items.forEach((child) => {
      if (child.gold_weight) {
        total_gold_weight += child.gold_weight;
      }
      if (typeof child.amount === 'number' && !isNaN(child.amount)) { // Check if amount is a valid number
        total_gold_amount += child.amount; // Calculate total_gold_amount
      }
    });
  }

  if (frm.doc.transaction_type !== 'Sales' && frm.doc.old_jewellery_items) {
    frm.doc.old_jewellery_items.forEach((child) => {
      if (child.weight) {
        total_old_gold_weight += child.weight;
      }
      if (typeof child.amount === 'number' && !isNaN(child.amount)) { // Check if amount is a valid number
        total_old_gold_amount += child.amount;
      }
    });
  }

  balance_amount = total_gold_amount - total_old_gold_amount;

  // Set values in the form
  frm.set_value('total_gold_weight', total_gold_weight);
  frm.set_value('total_gold_amount', total_gold_amount);
  frm.set_value('total_old_gold_weight', total_old_gold_weight);
  frm.set_value('total_old_gold_amount', total_old_gold_amount);
  frm.set_value('balance_amount', balance_amount);
  
  frm.refresh_fields();
}


// let set_net_weight_and_amount = function(frm){
//   let total_old_gold_weight = 0;
//   let total_gold_weight = 0;
//   let total_old_gold_amount = 0;
//   let total_gold_amount = 0;
//   let balance_amount = 0;
//   if(frm.doc.items){
//     frm.doc.items.forEach((child) => {
//       if(child.gold_weight){
//         total_gold_weight = total_gold_weight + child.gold_weight;
//       }
//       if(child.amount){
//         total_gold_amount = total_gold_amount + child.amount;
//       }
//     });
//   }
//   if(frm.doc.transaction_type!='Sales' && frm.doc.old_jewellery_items){
//     frm.doc.old_jewellery_items.forEach((child) => {
//       if(child.weight){
//         total_old_gold_weight = total_old_gold_weight + child.weight;
//       }
//       if(child.amount){
//         total_old_gold_amount = total_old_gold_amount + child.amount;
//       }
//     });
//   }
//   balance_amount = total_gold_amount - total_old_gold_amount
//   frm.set_value('total_gold_weight', total_gold_weight);
//   frm.set_value('total_gold_amount', total_gold_amount);
//   frm.set_value('total_old_gold_weight', total_old_gold_weight);
//   frm.set_value('total_old_gold_amount', total_old_gold_amount);
//   frm.set_value('balance_amount', balance_amount);
//   frm.refresh_fields();
// }

let set_missing_delivery_dates = function(frm){
  if(frm.doc.items){
    frm.doc.items.forEach((child) => {
      if(!child.delivery_date){
        child.delivery_date = frm.doc.delivery_date;
      }
    });
  }
  frm.refresh_fields('items');
}

let create_custom_buttons = function(frm){
  if(frm.doc.outstanding_amount > 0){
    frm.add_custom_button('Payment', () => {
      make_payment(frm);
    }, 'Create');
  }
  if (frm.doc.sales_order && !frm.doc.sales_invoice) {
    frm.add_custom_button('Invoice', () => {
        // Create Sales Invoice
        frappe.call('aumms.aumms.doctype.jewellery_invoice.jewellery_invoice.create_sales_invoice', {
            source_name: frm.doc.sales_order,
            jewellery_invoice: frm.doc.name,
            sales_taxes_and_charges_template : frm.doc.sales_taxes_and_charges_template,
            keep_metal_ledger : 1
        }).then(r => {
            frm.reload_doc();
        });
    }, 'Create');
  }
  // if (frm.doc.sales_invoice && !frm.doc.metal_ledger_entry){
  //   frappe.call('aumms.aumms.aumms.utils.create_metal_ledger_entries', {
  //     doc : frm.doc.sales_invoice
  //   }).then(r => {
  //     frm.reload_doc();
  //   });
  // }

  if(frm.doc.sales_invoice && !frm.doc.delivery_note && !frm.doc.delivered){
    frm.add_custom_button('Delivery Note', () => {
      //Delivery Note creation method
      frappe.call('aumms.aumms.doctype.jewellery_invoice.jewellery_invoice.create_delivery_note', {
        source_name: frm.doc.sales_invoice,
        jewellery_invoice: frm.doc.name
      }).then(r => {
        frm.reload_doc();
      });;
    }, 'Create');
  }
  if(frm.doc.sales_order && !frm.doc.sales_invoice && !frm.doc.delivery_note){
    frm.add_custom_button('Invoice and Delivery', () => {
      //Invoice and Deliver
      frappe.call('aumms.aumms.doctype.jewellery_invoice.jewellery_invoice.create_sales_invoice', {
        source_name: frm.doc.sales_order,
        jewellery_invoice: frm.doc.name,
        sales_taxes_and_charges_template : frm.doc.sales_taxes_and_charges_template,
        update_stock: 1,
        keep_metal_ledger :1
      }).then(r => {
        frm.reload_doc();
      });;
    }, 'Create');
  }

  if(frm.doc.sales_order && !frm.doc.sales_invoice){
    frm.add_custom_button('Get Customer Advances', () => {
      //To get customer advances
      get_customer_advances(frm);
    });
  }
}

let make_payment = function(frm){
  let d = new frappe.ui.Dialog({
    title: 'Payment Entry',
    fields: [
      {
          label: 'Mode of Payment',
          fieldname: 'mode_of_payment',
          fieldtype: 'Link',
          options: 'Mode of Payment',
          reqd: 1
      },
      {
          label:"Cheque/Reference No",
          fieldname: 'reference_no',
          fieldtype: 'Data',
          mandatory_depends_on: 'eval:doc.mode_of_payment!==\'Cash\'',
          depends_on: 'eval:doc.mode_of_payment!==\'Cash\''
      },
      {
          label:"Cheque/Reference Date",
          fieldname: 'reference_date',
          fieldtype: 'Date',
          mandatory_depends_on: 'eval:doc.mode_of_payment!==\'Cash\'',
          depends_on: 'eval:doc.mode_of_payment!==\'Cash\''
      },
      {
        label: 'Posting Date',
        fieldname: 'posting_date',
        fieldtype: 'Date'
      },
      {
        label: 'Payment Amount',
        fieldname: 'amount',
        fieldtype: 'Currency',
        default: frm.doc.outstanding_amount,
        reqd: 1
      },
      {
        label: 'Balance Amount',
        fieldname: 'balance',
        fieldtype: 'Currency',
        default: frm.doc.outstanding_amount,
        read_only: 1
      }
    ],
    primary_action_label: 'Submit',
    primary_action(values) {//Create Payment Entry
      if (values.amount) {
        if (parseFloat(values.amount) <= parseFloat(frm.doc.outstanding_amount)) {
          frappe.call({
            method: 'aumms.aumms.doctype.jewellery_invoice.jewellery_invoice.create_payment_entry',
            args: {
              'mode_of_payment':values.mode_of_payment,
              'amount': values.amount,
              'docname': frm.doc.name,
              'reference_no': values.reference_no,
              'reference_date': values.reference_date,
              'posting_date': values.posting_date
            },
            btn: $('.primary-action'),
            freeze: true,
            callback: function(r) {
              if (r.message){
                frm.reload_doc()
              }
            }
          })
        } else {
          frappe.throw(__('Amount of payment cannot exceed total amount'))
        }
      }
      d.hide();
    }
  });
  d.show();
}

let remove_previous_links = function(frm){
  if(frm.is_new()){
    frm.set_value('sales_order', );
    frm.set_value('sales_invoice', );
    frm.set_value('delivery_note', );
    frm.set_value('purchase_receipt', );
    frm.refresh_fields();
  }
}

let get_customer_advances= function(frm){
  frm.doc.items.forEach((child) => {
    frappe.call('aumms.aumms.utils.get_advances_payments_against_so_in_gold', {
      sales_order: frm.doc.sales_order,
      item_type: child.item_type,
      purity: child.purity,
      stock_uom: child.stock_uom
    }).then(r => {
      if(r.message){
        frm.clear_table('customer_advances');
        let total_advance_received = 0;
        let total_qty_obtained = 0;
        let purity = '';
        let uom = '';
        r.message.forEach((advance) => {
          frm.add_child('customer_advances', {
            'reference': advance.payment_entry,
            'posting_date': advance.posting_date,
            'item_type': advance.item_type,
            'purity': advance.purity,
            'amount': advance.amount,
            'board_rate': advance.board_rate,
            'stock_uom': advance.stock_uom,
            'qty_obtained': advance.qty_obtained
          });
          purity = advance.purity;
          uom = advance.stock_uom;
          total_advance_received = total_advance_received + (advance.amount);
          total_qty_obtained = total_qty_obtained + (advance.qty_obtained);
        });
        frm.set_value('total_advance_received', total_advance_received);
        frm.set_value('total_qty_obtained', total_qty_obtained);
        frm.set_value('uom', uom);
        frm.set_value('purity', purity);
        frm.save_or_update();
      }
    });
  });
}



// code to fetch the Item details by aj

frappe.ui.form.on('Jewellery Invoice Item', {
  item_code: function(frm, cdt, cdn) {
    let d = locals[cdt][cdn];

    if (d.item_code) {
      
      if (frm.doc.delivery_date) {
        frappe.model.set_value(d.doctype, d.name, 'delivery_date', frm.doc.delivery_date);
      }

      // Step 1: Fetch making_charge
      fetch_and_set_making_charge(frm, d);

      // Step 2: Fetch item details for purity items
      if (d.is_purity_item) {
        frappe.call({
          method: 'aumms.aumms.doc_events.sales_order.get_item_details',
          args: {
            'item_code': d.item_code,
            'item_type': d.item_type,
            'date': frm.doc.transaction_date,
            'purity': d.purity,
            'stock_uom': d.stock_uom
          },
          callback: function(r) {
            if (r.message) {
              frappe.model.set_value(d.doctype, d.name, 'gold_weight', r.message['gold_weight']);
              frappe.model.set_value(d.doctype, d.name, 'stone_weight', r.message['stone_weight']);
              frappe.model.set_value(d.doctype, d.name, 'net_weight', r.message['net_weight']);
              frappe.model.set_value(d.doctype, d.name, 'stone_charge', r.message['stone_charge']);
              frappe.model.set_value(d.doctype, d.name, 'making_charge_percentage', r.message['making_charge_percentage']);
              frappe.model.set_value(d.doctype, d.name, 'board_rate', r.message['board_rate']);
              frappe.model.set_value(d.doctype, d.name, 'making_charge_based_on', r.message['making_charge_based_on']);

              // Calculate amount without making charge
              let amount_without_making_charge = r.message['gold_weight'] * r.message['board_rate'];
              frappe.model.set_value(d.doctype, d.name, 'amount_with_out_making_charge', amount_without_making_charge);

              // Calculate net amount without making charge
              let net_amount_without_making_charge = amount_without_making_charge + r.message['stone_charge'];
              frappe.model.set_value(d.doctype, d.name, 'net_amount_with_out_making_charge', net_amount_without_making_charge);

              // Set rate using the making_charge already fetched earlier
              let making_charge = d.making_charge || 0;
              let total_rate = (net_amount_without_making_charge + making_charge) / r.message['gold_weight'];
              frappe.model.set_value(d.doctype, d.name, 'rate', total_rate);

              frm.refresh_field('items');
            }
          }
        });
      }

      // Step 3: Fetch board_rate
      if (d.purity && d.stock_uom) {
        frappe.call({
          method: 'aumms.aumms.utils.get_board_rate',
          args: {
            'item_type': d.item_type,
            'date': frm.doc.transaction_date,
            'purity': d.purity,
            'stock_uom': d.stock_uom
          },
          callback: function(r) {
            if (r.message) {
              let board_rate = r.message;
              frappe.model.set_value(d.doctype, d.name, 'board_rate', board_rate);
              frm.refresh_field('items');
            }
          }
        });
      }
    }
  }
});

//fetching making_charge
function fetch_and_set_making_charge(frm, d) {
  frappe.call({
    method: "aumms.aumms.doctype.jewellery_invoice.jewellery_invoice.get_making_charge",
    args: {
      item_code: d.item_code
    },
    callback: function(r) {
      if (r.message) {
        frappe.model.set_value(d.doctype, d.name, 'making_charge', r.message);
        console.log(r.message, 'Fetched making_charge');
        
      }
      frm.refresh_field('items');
    }
  });
};


// code by aj
// discount

frappe.ui.form.on('Stone Detals - 2', {
  discount: function(frm, cdt, cdn) {
    calculate_discount_and_total(frm, cdt, cdn);
  }
});

function calculate_discount_and_total(frm, cdt, cdn) {
  let row = locals[cdt][cdn];
  let discounted_amount = flt(row.stone_charge) * (1 - flt(row.discount) / 100);

  // Update the row's final discounted amount
  frappe.model.set_value(cdt, cdn, 'custom_discount_final', discounted_amount);

  // Calculate and set the total discounted amount
  let total = frm.doc.custom_stone_detail_.reduce((sum, r) => 
    sum + flt(r.stone_charge) * (1 - flt(r.discount) / 100), 0);
    
  frm.set_value('custom_discount_final', total);
  frm.refresh_fields(['custom_stone_detail_', 'custom_discount_final']);
}


// code to set Grand Total by aj

frappe.ui.form.on('Jewellery Invoice', {
  items: {
      board_rate: calculate_total,
      gold_weight: calculate_total,
      making_charge: calculate_total,
      items_add: calculate_total,
      items_remove: calculate_total
  },
  custom_discount_final: function(frm) {
      calculate_total(frm);
  }
});

function calculate_total(frm) {
  let total_amount = 0;
  let discount = frm.doc.custom_discount_final || 0;

  // Sum up for all items in the table
  frm.doc.items.forEach(function(item) {
      total_amount += (item.board_rate || 0) * (item.gold_weight || 0) + (item.making_charge || 0);
  });

  frm.set_value('grand_total', total_amount + discount);
  frm.set_value('rounded_total', grand_total)

}

