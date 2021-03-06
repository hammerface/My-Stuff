// $Id: listmap.java,v 1.4 2013-10-24 14:28:58-07 - - $

import java.util.Iterator;
import java.util.Map.Entry;
import java.util.NoSuchElementException;
import static java.lang.System.*;

class listmap implements Iterable<Entry<String,intqueue>> {

   private class node implements Entry<String,intqueue> {
      String key;
      intqueue queue = new intqueue();
      node link;
      public String getKey() {
         return key;
      }
      public intqueue getValue() {
         return queue;
      }
      public intqueue setValue (intqueue queue) {
         throw new UnsupportedOperationException();
      }
   }
   private node head = null;

   public listmap() {
      // Not needed, since head defaults to null anyway.
   }
   //Inserts keys into the linked list in lexicographic order, and 
   //passes the line number to intqueue.insert(). If the key is a 
   //repeat, it only sends the line number to intqueue.insert(), but 
   //does not add the key to the list.
   public void insert (String key, int linenr) {
      Iterator<Entry<String,intqueue>> i = iterator();
      node prev = null;
      int compare = 0;
      //if the list is empty the key is inserted as head
      if(head == null){
          head = new node();
          head.key = key;
          head.link = null;
          head.getValue().insert(linenr);
      }
      //After the first key, the insertion is handled in the do while
      //loop.
      else {
          node curr = head;
          do{
              i.next();
              compare = key.compareTo(curr.getKey());
              // If compare == 0 then this key has been seen before, 
              // and its line number is sent, but the key is not 
              // placed in the list.
              if (compare == 0){
              curr.getValue().insert(linenr);
              break;
              }
              // If compare > 0 then the loop continues to look through 
              // the list.
              if (compare > 0){
                  prev = curr;
                  curr = curr.link;
              }
              // If compare is < 0 then the key should be placed here. 
              // If curr == null then the end of the list has been 
              // reached and the key must be placed.
              if (compare < 0 || curr == null) {
                  node newNode = new node();
                  if(curr == null){
                      prev.link = newNode;
                      newNode.key = key;
                      newNode.link = null;
                      newNode.getValue().insert(linenr);
                  } else 
                  if(prev == null){
                      newNode.key = head.getKey();
                      newNode.queue = head.getValue();
                      newNode.link = head.link;
                      head = new node();
                      head.key = key;
                      head.link = newNode;
                      head.getValue().insert(linenr);
                  } else {
                      prev.link = newNode;
                      newNode.link = curr;
                      newNode.key = key;
                      newNode.getValue().insert(linenr);
                  }
                  break;
              }
          } while (i.hasNext());
       }
   }
      

   public Iterator<Entry<String,intqueue>> iterator() {
      return new iterator();
   }


   private class iterator
      implements Iterator<Entry<String,intqueue>> {
      node curr = head;

      public boolean hasNext() {
         return curr != null;
      }

      public Entry<String,intqueue> next() {
         if (curr == null) throw new NoSuchElementException();
         node next = curr;
         curr = curr.link;
         return next;
      }

      public void remove() {
         throw new UnsupportedOperationException();
      }

   }

}
