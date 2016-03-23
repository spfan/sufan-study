var controlCheckbox = document.getElementById('mainCheckbox'),
    addBtn          = document.getElementById('addNewObserver'),
    container       = document.getElementById('observersContainer');
    
extend(new Object(), controlCheckbox);

controlCheckbox.onClick = new Function('controlCheckbox.Notify(controlCheckbox.checked)');

addBtn.onClick = AddNewObserver;

function AddNewObserver() {
  var check = document.createElement('input');
  check.type = 'checkbox';
  
  extend(new Observer(), check);
  
  check.Update = function(value) {
    this.checked = value;
  }
  
  controlCheckbox.AddObserver(check);
  
  container.appendChild(check);

}
