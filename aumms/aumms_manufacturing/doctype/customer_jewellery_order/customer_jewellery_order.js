frappe.ui.form.on("Customer Jewellery Order", {
  refresh: function(frm){
    frm.set_query('stock_uom','order_items',() => {
      return {
        filters: {
          "is_purity_uom": 1
        }
      }
    })
  },
  purity : function(frm){
    frm.events.update_order_item_table(frm);
  },
  making_chargein_percentage : function(frm){
    frm.events.update_order_item_table(frm);
  },
  type : function(frm){
    frm.events.update_order_item_table(frm);
  },
  update_order_item_table: function update_order_item_table(frm){
    if(frm.doc.order_items){
      frm.doc.order_items.forEach(function(item){
        frappe.model.set_value(item.doctype, item.name, 'purity', frm.doc.purity);
        frappe.model.set_value(item.doctype, item.name, 'making_chargein_percentage', frm.doc.making_chargein_percentage);
        frappe.model.set_value(item.doctype, item.name, 'item_type', frm.doc.type);
      });
    }
    frm.refresh_fields();
  }
});

frappe.ui.form.on("Customer Jewellery Order Detail", {
  purity: function(frm, cdt, cdn){
    get_board_rate(frm, cdt, cdn)
  },
  item_type: function(frm, cdt, cdn){
    get_board_rate(frm, cdt, cdn)
  },
  stock_uom: function(frm, cdt, cdn){
    get_board_rate(frm, cdt, cdn)
  },
  qty: function (frm, cdt, cdn) {
    let d = locals[cdt][cdn];
    calculate_amount(frm, cdt, cdn);
    calculate_totals(frm, cdt, cdn);
  },
  board_rate: function (frm, cdt, cdn) {
    let d = locals[cdt][cdn];
    calculate_amount(frm, cdt, cdn);
  },
  weight: function (frm, cdt, cdn) {
    let d = locals[cdt][cdn];
    calculate_amount(frm, cdt, cdn);
    calculate_totals(frm);
  },
  making_chargein_percentage:function (frm, cdt, cdn){
    let d = locals[cdt][cdn];
    calculate_amount(frm, cdt, cdn);
    calculate_totals(frm);
  },
  order_items_remove: function (frm, cdt, cdn) {
    calculate_totals(frm)
  },
  order_items_add : function(frm, cdt, cdn){
    frm.events.update_order_item_table(frm);
  },
  amount: function(frm, cdt, cdn){
    calculate_totals(frm);
  }
});

function get_board_rate(frm, cdt, cdn){
  var d=locals[cdt][cdn];
  if(d.item_type && d.purity && d.stock_uom){
    frappe.call({
      method: 'aumms.aumms.utils.get_board_rate',
      args: {
          'item_type': d.item_type,
          'date': frappe.datetime.get_today(),
          'purity': d.purity,
          'stock_uom': d.stock_uom
      },
      callback: function(r) {
        if (r.message) {
          let board_rate = r.message
          console.log(board_rate);
          frappe.model.set_value(cdt, cdn, 'board_rate', board_rate);
          frm.refresh_field('order_items');
        }
      }
    });
  }
}

function calculate_amount(frm, cdt, cdn){
  var child=locals[cdt][cdn];
  if(child.qty && child.weight && child.board_rate){
    frappe.model.set_value(cdt, cdn, 'amount_without_making_charge', child.qty * child.weight * child.board_rate);
  }
  else {
    frappe.model.set_value(cdt, cdn, 'amount_without_making_charge', 0);
  }
  if(child.making_chargein_percentage && child.amount_without_making_charge){
    frappe.model.set_value(cdt, cdn, 'amount', child.amount_without_making_charge + (child.making_chargein_percentage/100));
  }
  else{
    frappe.model.set_value(cdt, cdn, 'amount', 0);
  }
  frm.refresh_field('order_item');
}

function calculate_totals(frm , cdt, cdn) {
  var total_weightage = 0;
  var total_amount = 0;
  var total_making_charge = 0
  frm.doc.order_items.forEach(function (d) {
    total_weightage += d.weight * d.qty;
    total_amount += d.amount;
    total_making_charge = d.making_chargein_percentage;

  });
  frm.set_value("expected_total_weight", total_weightage);
  frm.set_value("expected_total_amount", total_amount);
  frm.set_value("expected_making_charge", total_making_charge);
};
